<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Category;
use App\Models\User;
use App\Traits\WablasTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BroadcastController extends Controller
{
    use WablasTrait;

    public function index()
    {
        $broadcasts = Broadcast::latest()->get();

        return Inertia::render('admin/broadcasts/index', [
            'broadcasts' => $broadcasts,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/broadcasts/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|min:10',
        ]);

        Broadcast::create([
            'title' => $request->title,
            'message' => $request->message,
        ]);

        return redirect()->route('broadcasts.index')->with('success', 'Broadcast berhasil disimpan.');
    }

    public function edit(string $id)
    {
        $broadcast = Broadcast::findOrFail($id);
        return Inertia::render('admin/broadcasts/edit', [
            'broadcast' => $broadcast,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|min:10',
        ]);

        $broadcast = Broadcast::findOrFail($id);
        $broadcast->update([
            'title' => $request->title,
            'message' => $request->message,
        ]);

        return redirect()->route('broadcasts.index')->with('success', 'Broadcast berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        Broadcast::findOrFail($id)->delete();
        return redirect()->route('broadcasts.index')->with('success', 'Broadcast berhasil dihapus.');
    }

    public function show(string $id)
    {
        $broadcast = Broadcast::findOrFail($id);
        $categories = Category::select('id', 'name')->get();
        $courses = \App\Models\Course::select('id', 'title')->get();
        $bootcamps = \App\Models\Bootcamp::select('id', 'title')->get();
        $webinars = \App\Models\Webinar::select('id', 'title')->get();
        $certifications = \App\Models\CertificationProgram::select('id', 'title')->get();

        return Inertia::render('admin/broadcasts/show', [
            'broadcast' => $broadcast,
            'categories' => $categories,
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars,
            'certifications' => $certifications,
        ]);
    }

    public function filteredUsers(Request $request)
    {
        $filters = $request->input('filters', []);
        $query = $this->buildFilteredQuery($filters);

        $users = $query->orderBy('name')
            ->get()
            ->map(function ($user, $index) {
                $phone = preg_replace('/[^0-9]/', '', $user->phone_number ?? '');
                if (substr($phone, 0, 1) == '0') {
                    $phone = '62' . substr($phone, 1);
                }
                if (substr($phone, 0, 2) != '62') {
                    $phone = '62' . $phone;
                }

                return [
                    'no' => $index + 1,
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone_number' => $user->phone_number,
                    'formatted_phone' => $phone,
                    'wa_link' => $user->phone_number ? "https://wa.me/{$phone}" : null,
                ];
            });

        return response()->json([
            'users' => $users,
            'total' => $users->count(),
        ]);
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|min:10',
            'from' => 'required|integer|min:1',
            'to' => 'required|integer|gte:from',
            'filters' => 'nullable|array',
            'broadcast_id' => 'nullable|string',
        ]);

        $filters = $request->input('filters', []);
        $message = $request->input('message');

        $query = $this->buildFilteredQuery($filters);
        $users = $query->orderBy('name')->get();
        $totalFiltered = $users->count();

        $from = $request->input('from');
        $to = min($request->input('to'), $totalFiltered);

        if ($from > $totalFiltered) {
            return back()->with('error', "Urutan dari ({$from}) melebihi total pengguna terfilter ({$totalFiltered}).");
        }

        $selectedUsers = $users->slice($from - 1, $to - $from + 1)->values();
        $waData = [];
        $sentCount = 0;

        foreach ($selectedUsers as $user) {
            $phone = preg_replace('/[^0-9]/', '', $user->phone_number);
            if (substr($phone, 0, 1) == '0') {
                $phone = '62' . substr($phone, 1);
            }
            if (substr($phone, 0, 2) != '62') {
                $phone = '62' . $phone;
            }

            // Strip HTML for WA plain text
            $plainMessage = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $message));
            $personalMessage = str_replace('{nama}', $user->name, $plainMessage);

            $waData[] = [
                'phone' => $phone,
                'message' => $personalMessage,
                'isGroup' => 'false',
            ];
            $sentCount++;
        }

        if (empty($waData)) {
            return back()->with('error', 'Tidak ada pengguna yang cocok dengan filter.');
        }

        try {
            $sent = self::sendText($waData);

            if ($request->input('broadcast_id')) {
                $broadcast = Broadcast::find($request->input('broadcast_id'));
                if ($broadcast) {
                    $broadcast->update([
                        'total_sent' => $broadcast->total_sent + $sentCount,
                        'last_sent_at' => now(),
                    ]);
                }
            }

            if ($sent) {
                Log::info('Broadcast sent successfully', ['total_recipients' => $sentCount, 'range' => "{$from}-{$to}"]);
                return back()->with('success', "Broadcast berhasil dikirim ke {$sentCount} pengguna (urutan {$from}-{$to} dari {$totalFiltered}).");
            } else {
                return back()->with('error', 'Gagal mengirim broadcast. Periksa konfigurasi Wablas.');
            }
        } catch (\Exception $e) {
            Log::error('Broadcast failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function sendSingle(Request $request, string $id)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string|min:10',
        ]);

        $broadcast = Broadcast::findOrFail($id);
        $user = User::findOrFail($request->user_id);

        $phone = preg_replace('/[^0-9]/', '', $user->phone_number);
        if (substr($phone, 0, 1) == '0') {
            $phone = '62' . substr($phone, 1);
        }
        if (substr($phone, 0, 2) != '62') {
            $phone = '62' . $phone;
        }

        $plainMessage = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $request->message));
        $personalMessage = str_replace('{nama}', $user->name, $plainMessage);

        $waData = [
            [
                'phone' => $phone,
                'message' => $personalMessage,
                'isGroup' => 'false',
            ]
        ];

        try {
            $sent = self::sendText($waData);

            if ($sent) {
                $broadcast->update([
                    'total_sent' => $broadcast->total_sent + 1,
                    'last_sent_at' => now(),
                ]);
                return back()->with('success', "Pesan berhasil dikirim via Wablas ke {$user->name}.");
            } else {
                return back()->with('error', 'Gagal mengirim pesan. Periksa konfigurasi Wablas.');
            }
        } catch (\Exception $e) {
            Log::error('Single broadcast failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    private function buildFilteredQuery(array $filters)
    {
        $query = User::role('user')
            ->whereNotNull('phone_number')
            ->where('phone_number', '!=', '');

        if (!empty($filters['program_types'])) {
            $types = $filters['program_types'];
            $query->where(function ($q) use ($types, $filters) {
                foreach ($types as $type) {
                    if ($type === 'course') {
                        if (!empty($filters['specific_courses'])) {
                            $q->orWhereHas('courseEnrollments', fn($sub) => 
                                $sub->whereIn('course_id', $filters['specific_courses'])
                                    ->whereHas('invoice', fn($inv) => $inv->where('status', 'paid'))
                            );
                        } else {
                            $q->orWhereHas('courseEnrollments', fn($sub) => $sub->whereHas('invoice', fn($inv) => $inv->where('status', 'paid')));
                        }
                    } elseif ($type === 'bootcamp') {
                        if (!empty($filters['specific_bootcamps'])) {
                            $q->orWhereHas('bootcampEnrollments', fn($sub) => 
                                $sub->whereIn('bootcamp_id', $filters['specific_bootcamps'])
                                    ->whereHas('invoice', fn($inv) => $inv->where('status', 'paid'))
                            );
                        } else {
                            $q->orWhereHas('bootcampEnrollments', fn($sub) => $sub->whereHas('invoice', fn($inv) => $inv->where('status', 'paid')));
                        }
                    } elseif ($type === 'webinar') {
                        if (!empty($filters['specific_webinars'])) {
                            $q->orWhereHas('webinarEnrollments', fn($sub) => 
                                $sub->whereIn('webinar_id', $filters['specific_webinars'])
                                    ->whereHas('invoice', fn($inv) => $inv->where('status', 'paid'))
                            );
                        } else {
                            $q->orWhereHas('webinarEnrollments', fn($sub) => $sub->whereHas('invoice', fn($inv) => $inv->where('status', 'paid')));
                        }
                    } elseif ($type === 'certification') {
                        if (!empty($filters['specific_certifications'])) {
                            $q->orWhereHas('certificationProgramEnrollments', fn($sub) => 
                                $sub->whereIn('certification_program_id', $filters['specific_certifications'])
                                    ->whereHas('invoice', fn($inv) => $inv->where('status', 'paid'))
                            );
                        } else {
                            $q->orWhereHas('certificationProgramEnrollments', fn($sub) => $sub->whereHas('invoice', fn($inv) => $inv->where('status', 'paid')));
                        }
                    }
                }
            });
        }

        if (!empty($filters['categories'])) {
            $categoryNames = $filters['categories'];
            $query->where(function ($q) use ($categoryNames) {
                $q->whereHas('courseEnrollments.course.category', fn($sub) => $sub->whereIn('name', $categoryNames))
                  ->orWhereHas('bootcampEnrollments.bootcamp.category', fn($sub) => $sub->whereIn('name', $categoryNames))
                  ->orWhereHas('webinarEnrollments.webinar.category', fn($sub) => $sub->whereIn('name', $categoryNames))
                  ->orWhereHas('certificationProgramEnrollments.certificationProgram.category', fn($sub) => $sub->whereIn('name', $categoryNames));
            });
        }

        if (!empty($filters['purchase_date_from']) || !empty($filters['purchase_date_to'])) {
            $query->whereHas('invoices', function ($q) use ($filters) {
                $q->where('status', 'paid');
                if (!empty($filters['purchase_date_from'])) {
                    $q->where('paid_at', '>=', Carbon::parse($filters['purchase_date_from'])->startOfDay());
                }
                if (!empty($filters['purchase_date_to'])) {
                    $q->where('paid_at', '<=', Carbon::parse($filters['purchase_date_to'])->endOfDay());
                }
            });
        }

        if (!empty($filters['joined_date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['joined_date_from'])->startOfDay());
        }
        if (!empty($filters['joined_date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['joined_date_to'])->endOfDay());
        }

        return $query;
    }
}
