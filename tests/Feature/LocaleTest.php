<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_switch_locale_via_post_request()
    {
        $response = $this->post('/locale', [
            'locale' => 'en',
        ]);

        $response->assertSessionHas('locale', 'en');
        $response->assertPlainCookie('locale', 'en');
    }

    public function test_invalid_locale_is_rejected()
    {
        $response = $this->post('/locale', [
            'locale' => 'fr',
        ]);

        $response->assertSessionHasErrors('locale');
    }

    public function test_authenticated_user_can_switch_locale()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/locale', [
            'locale' => 'en',
        ]);

        $response->assertSessionHas('locale', 'en');
        $response->assertPlainCookie('locale', 'en');
    }

    public function test_set_locale_middleware_applies_session_locale()
    {
        $response = $this->withSession(['locale' => 'en'])->get('/');

        $response->assertStatus(200);
        $this->assertEquals('en', app()->getLocale());
    }

    public function test_pdf_invoice_respects_locale()
    {
        $user = User::factory()->create();
        $invoice = \App\Models\Invoice::create([
            'user_id' => $user->id,
            'invoice_code' => 'AKS-LOCALE-001',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'status' => 'paid',
            'paid_at' => \Carbon\Carbon::parse('2026-05-15 10:30:00'),
            'payment_method' => 'Bank Transfer',
            'is_installment' => false,
        ]);

        $responseEn = $this->actingAs($user)->get("/invoice/{$invoice->id}/pdf?lang=en");
        $responseEn->assertStatus(200);
        $this->assertEquals('application/pdf', $responseEn->headers->get('Content-Type'));

        $responseId = $this->actingAs($user)->get("/invoice/{$invoice->id}/pdf?lang=id");
        $responseId->assertStatus(200);
        $this->assertEquals('application/pdf', $responseId->headers->get('Content-Type'));
    }
}
