<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromQuery;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class TransactionsExport implements
    FromQuery,
    \Maatwebsite\Excel\Concerns\WithHeadings,
    \Maatwebsite\Excel\Concerns\WithMapping,
    \Maatwebsite\Excel\Concerns\WithColumnWidths,
    \Maatwebsite\Excel\Concerns\WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $status;
    protected $paymentType;
    protected $productType;
    protected $bootcampId;
    protected $webinarId;
    protected $courseId;
    protected $bundleId;
    protected $certificationProgramId;
    protected $title;
    protected $userName;

    public function __construct($filters = [])
    {
        $this->startDate = $filters['start_date'] ?? null;
        $this->endDate = $filters['end_date'] ?? null;
        $this->status = $filters['status'] ?? null;
        $this->paymentType = $filters['payment_type'] ?? null;
        $this->productType = $filters['product_type'] ?? null;
        $this->bootcampId = $filters['bootcamp_id'] ?? null;
        $this->webinarId = $filters['webinar_id'] ?? null;
        $this->courseId = $filters['course_id'] ?? null;
        $this->bundleId = $filters['bundle_id'] ?? null;
        $this->certificationProgramId = $filters['certification_program_id'] ?? null;
        $this->title = $filters['title'] ?? null;
        $this->userName = $filters['user_name'] ?? null;
    }

    public function query()
    {
        $query = Invoice::with([
            'user.referrer',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'bundleEnrollments.bundle',
            'certificationProgramItems.certificationProgram'
        ]);

        // Apply date filter
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [
                Carbon::parse($this->startDate)->startOfDay(),
                Carbon::parse($this->endDate)->endOfDay()
            ]);
        }

        // Apply status filter
        if ($this->status) {
            $query->where('status', $this->status);
        }

        // Apply payment type filter
        if ($this->paymentType === 'free') {
            $query->where('nett_amount', 0);
        } elseif ($this->paymentType === 'paid') {
            $query->where('nett_amount', '>', 0);
        }

        // Apply product type filter
        if ($this->productType) {
            switch ($this->productType) {
                case 'course':
                    if ($this->courseId) {
                        // Filter by specific course
                        $query->whereHas('courseItems', function ($q) {
                            $q->where('course_id', $this->courseId);
                        });
                    } else {
                        // All courses
                        $query->whereHas('courseItems');
                    }
                    $query->doesntHave('bundleEnrollments');
                    break;
                case 'bootcamp':
                    if ($this->bootcampId) {
                        // Filter by specific bootcamp
                        $query->whereHas('bootcampItems', function ($q) {
                            $q->where('bootcamp_id', $this->bootcampId);
                        });
                    } else {
                        // All bootcamps
                        $query->whereHas('bootcampItems');
                    }
                    $query->doesntHave('bundleEnrollments');
                    break;
                case 'webinar':
                    if ($this->webinarId) {
                        // Filter by specific webinar
                        $query->whereHas('webinarItems', function ($q) {
                            $q->where('webinar_id', $this->webinarId);
                        });
                    } else {
                        // All webinars
                        $query->whereHas('webinarItems');
                    }
                    $query->doesntHave('bundleEnrollments');
                    break;
                case 'bundle':
                    if ($this->bundleId) {
                        // Filter by specific bundle
                        $query->whereHas('bundleEnrollments', function ($q) {
                            $q->where('bundle_id', $this->bundleId);
                        });
                    } else {
                        // All bundles
                        $query->whereHas('bundleEnrollments');
                    }
                    break;
                case 'private':
                    $query->whereHas('privateItems');
                    $query->doesntHave('bundleEnrollments');
                    break;
                case 'certification_program':
                    if ($this->certificationProgramId) {
                        $query->whereHas('certificationProgramItems', function ($q) {
                            $q->where('certification_program_id', $this->certificationProgramId);
                        });
                    } else {
                        $query->whereHas('certificationProgramItems');
                    }
                    $query->doesntHave('bundleEnrollments');
                    break;
            }
        }

        // Apply user name filter
        if ($this->userName) {
            $query->whereHas('user', function ($q) {
                $q->where('name', 'like', '%' . $this->userName . '%');
            });
        }

        // Apply title filter
        if ($this->title) {
            $title = $this->title;
            if ($this->productType) {
                switch ($this->productType) {
                    case 'course':
                        $query->whereHas('courseItems.course', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'bootcamp':
                        $query->whereHas('bootcampItems.bootcamp', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'webinar':
                        $query->whereHas('webinarItems.webinar', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'private':
                        $query->whereHas('privateItems.privateClass', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'bundle':
                        $query->whereHas('bundleEnrollments.bundle', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'certification_program':
                        $query->whereHas('certificationProgramItems.certificationProgram', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                }
            } else {
                $query->where(function ($q) use ($title) {
                    $q->whereHas('courseItems.course', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('bootcampItems.bootcamp', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('webinarItems.webinar', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('privateItems.privateClass', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('bundleEnrollments.bundle', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('certificationProgramItems.certificationProgram', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    });
                });
            }
        }

        return $query->latest();
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Invoice',
            'Nama Pembeli',
            'Email',
            'No. HP',
            'Instansi',
            'Kota Domisili',
            'Nama Produk',
            'Jenis Produk',
            'Harga Asli',
            'Diskon',
            'Biaya Admin',
            'Total Bayar',
            'Status',
            'Jenis Pembayaran',
            'Metode Pembayaran',
            'Channel Pembayaran',
            'Afiliasi',
            'Tanggal Pembelian',
            'Tanggal Pembayaran',
        ];
    }

    public function map($invoice): array
    {
        static $index = 0;
        $index++;

        return [
            $index,
            $invoice->invoice_code,
            $invoice->user->name ?? '-',
            $invoice->user->email ?? '-',
            $invoice->user->phone_number ?? '-',
            $invoice->user->instance ?? '-',
            $invoice->user->city ?? '-',
            $this->getProductNames($invoice),
            $this->getProductType($invoice),
            'Rp ' . number_format($invoice->amount, 0, ',', '.'),
            'Rp ' . number_format($invoice->discount_amount ?? 0, 0, ',', '.'),
            'Rp ' . number_format($invoice->transaction_fee ?? 0, 0, ',', '.'),
            'Rp ' . number_format($invoice->nett_amount, 0, ',', '.'),
            ucfirst($invoice->status),
            $invoice->nett_amount === 0 ? 'Gratis' : 'Berbayar',
            $invoice->payment_method ?? '-',
            $invoice->payment_channel ?? '-',
            $invoice->user->referrer->name ?? '-',
            $invoice->created_at ? $invoice->created_at->format('d M Y, H:i') : '-',
            $invoice->paid_at ? Carbon::parse($invoice->paid_at)->format('d M Y, H:i') : '-',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,  // No
            'B' => 15, // Kode Invoice
            'C' => 25, // Nama Pembeli
            'D' => 30, // Email
            'E' => 15, // No. HP
            'F' => 20, // Instansi
            'G' => 20, // Kota Domisili
            'H' => 40, // Nama Produk
            'I' => 15, // Jenis Produk
            'J' => 15, // Harga Asli
            'K' => 15, // Diskon
            'L' => 12, // Biaya Admin
            'M' => 15, // Total Bayar
            'N' => 10, // Status
            'O' => 15, // Jenis Pembayaran
            'P' => 18, // Metode Pembayaran
            'Q' => 18, // Channel Pembayaran
            'R' => 25, // Afiliasi
            'S' => 20, // Tanggal Pembelian
            'T' => 20, // Tanggal Pembayaran
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style header row
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0']
                ],
            ],
        ];
    }

    private function getProductNames($invoice): string
    {
        $names = [];

        if (empty($this->productType) || $this->productType === 'course') {
            if ($invoice->courseItems) {
                foreach ($invoice->courseItems as $item) {
                    $names[] = $item->course->title ?? '-';
                }
            }
        }

        if (empty($this->productType) || $this->productType === 'bootcamp') {
            if ($invoice->bootcampItems) {
                foreach ($invoice->bootcampItems as $item) {
                    $names[] = $item->bootcamp->title ?? '-';
                }
            }
        }

        if (empty($this->productType) || $this->productType === 'webinar') {
            if ($invoice->webinarItems) {
                foreach ($invoice->webinarItems as $item) {
                    $names[] = $item->webinar->title ?? '-';
                }
            }
        }

        if (empty($this->productType) || $this->productType === 'private') {
            if ($invoice->privateItems) {
                foreach ($invoice->privateItems as $item) {
                    $names[] = $item->privateClass->title ?? '-';
                }
            }
        }

        if (empty($this->productType) || $this->productType === 'bundle') {
            if ($invoice->bundleEnrollments) {
                foreach ($invoice->bundleEnrollments as $item) {
                    $names[] = $item->bundle->title ?? '-';
                }
            }
        }

        if (empty($this->productType) || $this->productType === 'certification_program') {
            if ($invoice->certificationProgramItems) {
                foreach ($invoice->certificationProgramItems as $item) {
                    $names[] = $item->certificationProgram->title ?? '-';
                }
            }
        }

        return implode(', ', $names) ?: '-';
    }

    private function getProductType($invoice): string
    {
        if (!empty($this->productType)) {
            switch ($this->productType) {
                case 'bundle': return 'Bundle';
                case 'course': return 'Kelas Online';
                case 'bootcamp': return 'Bootcamp';
                case 'webinar': return 'Webinar';
                case 'private': return 'Private Class';
                case 'certification_program': return 'Sertifikasi';
            }
        }

        if ($invoice->bundleEnrollments && $invoice->bundleEnrollments->count() > 0) return 'Bundle';
        if ($invoice->courseItems && $invoice->courseItems->count() > 0) return 'Kelas Online';
        if ($invoice->bootcampItems && $invoice->bootcampItems->count() > 0) return 'Bootcamp';
        if ($invoice->webinarItems && $invoice->webinarItems->count() > 0) return 'Webinar';
        if ($invoice->privateItems && $invoice->privateItems->count() > 0) return 'Private Class';
        if ($invoice->certificationProgramItems && $invoice->certificationProgramItems->count() > 0) return 'Sertifikasi';
        return '-';
    }
}
