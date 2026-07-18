<?php

use App\Models\User;
use App\Models\Invoice;
use App\Models\Setting;
use App\Models\PointTransaction;
use App\Services\PointService;
use App\Events\TransactionPaid;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'user']);
});

test('new users get a referral code generated automatically on registration', function () {
    $response = $this->post('/register', [
        'name' => 'Referral Tester',
        'email' => 'ref_tester@example.com',
        'phone_number' => '081234567890',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $user = User::where('email', 'ref_tester@example.com')->first();
    
    expect($user->referral_code)->not->toBeNull()
        ->and(strlen($user->referral_code))->toBe(11)
        ->and(str_starts_with($user->referral_code, 'AKSA-'))->toBeTrue()
        ->and($user->point_balance)->toBe(0);
});

test('validates valid and invalid referral codes correctly', function () {
    $userA = User::factory()->create([
        'email' => 'usera@example.com',
        'referral_code' => 'AKSA-USERAA',
        'point_balance' => 0
    ]);
    
    $userB = User::factory()->create([
        'email' => 'userb@example.com',
        'referral_code' => 'AKSA-USERBB',
        'point_balance' => 0
    ]);

    // Guest user can validate with a non-matching email
    $response = $this->postJson('/api/referral/validate', [
        'code' => 'AKSA-USERAA',
        'email' => 'guest@example.com'
    ]);
    $response->assertStatus(200)
        ->assertJson([
            'valid' => true,
            'referrer' => ['name' => $userA->name]
        ]);

    // Guest self-referral check by email matching referrer email
    $response = $this->postJson('/api/referral/validate', [
        'code' => 'AKSA-USERAA',
        'email' => 'usera@example.com'
    ]);
    $response->assertStatus(200)
        ->assertJson([
            'valid' => false,
            'message' => 'Anda tidak bisa menggunakan kode referral Anda sendiri.'
        ]);

    $this->actingAs($userB);

    // Validate valid code of another user
    $response = $this->postJson('/api/referral/validate', ['code' => 'AKSA-USERAA']);
    $response->assertStatus(200)
        ->assertJson([
            'valid' => true,
            'referrer' => ['name' => $userA->name]
        ]);

    // Validate invalid code
    $response = $this->postJson('/api/referral/validate', ['code' => 'INVALIDCODE']);
    $response->assertStatus(200)
        ->assertJson([
            'valid' => false,
            'message' => 'Kode referral tidak ditemukan.'
        ]);

    // Self-referral should be invalid for logged-in user
    $response = $this->postJson('/api/referral/validate', ['code' => 'AKSA-USERBB']);
    $response->assertStatus(200)
        ->assertJson([
            'valid' => false,
            'message' => 'Anda tidak bisa menggunakan kode referral Anda sendiri.'
        ]);
});

test('returns user point balance successfully', function () {
    $user = User::factory()->create(['point_balance' => 12500]);
    
    $this->actingAs($user)
        ->getJson('/api/user/points')
        ->assertStatus(200)
        ->assertJson(['point_balance' => 12500]);
});

test('PointService correctly adjusts balances and creates transactions', function () {
    $user = User::factory()->create(['point_balance' => 1000]);
    $service = app(PointService::class);

    // Positive adjustment
    $service->adjustPoints($user->id, 500, 'referral', 'Bonus referral');
    $user->refresh();
    expect($user->point_balance)->toBe(1500);

    $tx = PointTransaction::where('user_id', $user->id)->first();
    expect($tx)->not->toBeNull()
        ->and($tx->amount)->toBe(500)
        ->and($tx->type)->toBe('adjustment')
        ->and($tx->description)->toBe('Bonus referral');

    // Negative adjustment
    $service->adjustPoints($user->id, -300, 'checkout', 'Potongan checkout');
    $user->refresh();
    expect($user->point_balance)->toBe(1200);

    // Deducting too much should throw exception
    expect(fn() => $service->adjustPoints($user->id, -2000, 'checkout', 'Fail'))
        ->toThrow(\Exception::class, 'Saldo poin tidak mencukupi');
});

test('referral reward point is awarded when invoice is paid', function () {
    Setting::set('referral_reward', 5000);
    Setting::set('buyer_reward', 2000);
    Setting::set('referral_only_first_purchase', true);

    $referrer = User::factory()->create(['referral_code' => 'AKSA-REFERR']);
    $buyer = User::factory()->create(['point_balance' => 0]);

    // Create a mock invoice referring to referrer
    $invoice = Invoice::create([
        'invoice_code' => 'INV-TEST-PAID-01',
        'user_id' => $buyer->id,
        'amount' => 100000,
        'nett_amount' => 100000,
        'status' => 'pending',
        'referral_code' => 'AKSA-REFERR',
        'referral_user_id' => $referrer->id,
    ]);

    // Act: Mark invoice as paid and dispatch TransactionPaid event
    $invoice->update(['status' => 'paid']);
    event(new TransactionPaid($invoice));

    // Assert: Check referrer got 5000 and buyer got 2000
    $referrer->refresh();
    $buyer->refresh();

    expect($referrer->point_balance)->toBe(5000)
        ->and($buyer->point_balance)->toBe(2000);

    // Check transactions
    $refTx = PointTransaction::where('user_id', $referrer->id)->first();
    expect($refTx->amount)->toBe(5000)
        ->and($refTx->type)->toBe('reward');

    $buyerTx = PointTransaction::where('user_id', $buyer->id)->first();
    expect($buyerTx->amount)->toBe(2000)
        ->and($buyerTx->type)->toBe('reward');
});

test('admin can update settings and adjust user points', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $user = User::factory()->create(['point_balance' => 1000]);

    $this->actingAs($admin);

    // Update settings
    $this->post('/admin/referral/settings', [
        'referral_reward' => 7500,
        'buyer_reward' => 3500,
        'referral_only_first_purchase' => false,
    ])->assertRedirect();

    expect((int) Setting::get('referral_reward'))->toBe(7500)
        ->and((int) Setting::get('buyer_reward'))->toBe(3500)
        ->and((int) Setting::get('referral_only_first_purchase'))->toBe(0);

    // Adjust points
    $this->post('/admin/referral/adjust-points', [
        'user_id' => $user->id,
        'amount' => 1500,
        'description' => 'Admin manual correction bonus',
    ])->assertRedirect();

    $user->refresh();
    expect($user->point_balance)->toBe(2500);

    $tx = PointTransaction::where('user_id', $user->id)->orderBy('created_at', 'desc')->first();
    expect($tx->amount)->toBe(1500)
        ->and($tx->type)->toBe('adjustment')
        ->and($tx->description)->toBe('Admin manual correction bonus');
});
