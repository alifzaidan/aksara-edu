<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_code }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        .header {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
            padding: 0;
        }

        .company-info {
            width: 50%;
        }

        .invoice-info {
            width: 50%;
            text-align: right;
        }

        .logo-container {
            margin-bottom: 15px;
        }

        .logo {
            max-width: 150px;
            max-height: 60px;
            height: auto;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }

        .company-details {
            font-size: 11px;
            color: #666;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .invoice-code {
            font-size: 14px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }

        .customer-section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        .customer-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th {
            background-color: #007bff;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }

        .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
        }

        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .summary-table {
            width: 300px;
            margin-left: auto;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
        }

        .summary-table .total-row {
            background-color: #007bff;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }

        .payment-info {
            margin-top: 30px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
        }

        .payment-status {
            color: #155724;
            font-weight: bold;
            font-size: 14px;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-success {
            background-color: #28a745;
            color: white;
        }
    </style>
</head>

<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="company-info">
                    <div class="logo-container">
                        <img src="{{ public_path('assets/images/logo-primary-sm.png') }}" alt="Aksademy Logo"
                            class="logo">
                    </div>
                    <div class="company-details">
                        {{ $company['address'] }}<br>
                        Tel: {{ $company['phone'] }}<br>
                        Email: {{ $company['email'] }}<br>
                        Website: {{ $company['website'] }}
                    </div>
                </td>
                <td class="invoice-info">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-code">#{{ $invoice->invoice_code }}</div>
                    <div style="font-size: 11px; color: #666;">
                        Tanggal: {{ \Carbon\Carbon::parse($invoice->created_at)->format('d M Y') }}<br>
                        @if($invoice->paid_at)
                        Dibayar: {{ \Carbon\Carbon::parse($invoice->paid_at)->format('d M Y') }}
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="customer-section">
        <div class="section-title">Informasi Pelanggan</div>
        <div class="customer-info">
            <strong>{{ $invoice->user->name }}</strong><br>
            Email: {{ $invoice->user->email }}<br>
            @if($invoice->user->phone_number)
            Telepon: {{ $invoice->user->phone_number }}<br>
            @endif
        </div>
    </div>

    <div class="section-title">Detail Pembelian</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 10%">No</th>
                <th style="width: 20%">Kategori</th>
                <th style="width: 50%">Nama Program</th>
                <th style="width: 20%" class="text-right">Harga</th>
            </tr>
        </thead>
        <tbody>
            @php
            $itemNumber = 1;
            $subtotal = 0;
            @endphp

            @foreach($invoice->courseItems as $item)
            <tr>
                <td class="text-center">{{ $itemNumber++ }}</td>
                <td>
                    <span class="badge badge-success">Kelas Online</span>
                </td>
                <td>
                    <strong>{{ $item->course->title }}</strong>
                    @if($item->course->description)
                    <br><small style="color: #666;">{{ Str::limit($item->course->description, 100) }}</small>
                    @endif
                </td>
                <td class="text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
            </tr>
            @php $subtotal += $item->price; @endphp
            @endforeach

            @foreach($invoice->bootcampItems as $item)
            <tr>
                <td class="text-center">{{ $itemNumber++ }}</td>
                <td>
                    <span class="badge" style="background-color: #fd7e14; color: white;">Bootcamp</span>
                </td>
                <td>
                    <strong>{{ $item->bootcamp->title }}</strong>
                    @if($item->bootcamp->description)
                    <br><small style="color: #666;">{{ Str::limit($item->bootcamp->description, 100) }}</small>
                    @endif
                </td>
                <td class="text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
            </tr>
            @php $subtotal += $item->price; @endphp
            @endforeach

            @foreach($invoice->webinarItems as $item)
            <tr>
                <td class="text-center">{{ $itemNumber++ }}</td>
                <td>
                    <span class="badge" style="background-color: #6f42c1; color: white;">Webinar</span>
                </td>
                <td>
                    <strong>{{ $item->webinar->title }}</strong>
                    @if($item->webinar->description)
                    <br><small style="color: #666;">{{ Str::limit($item->webinar->description, 100) }}</small>
                    @endif
                </td>
                <td class="text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
            </tr>
            @php $subtotal += $item->price; @endphp
            @endforeach
        </tbody>
    </table>

    <table class="summary-table">
        @if($invoice->discount_amount > 0)
        <tr>
            <td>Harga Asli:</td>
            <td class="text-right">Rp {{ number_format($invoice->discount_amount + $subtotal, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Diskon:</td>
            <td class="text-right" style="color: #dc3545;">-Rp {{ number_format($invoice->discount_amount,
                0, ',', '.') }}</td>
        </tr>
        @endif
        <tr>
            <td>Subtotal:</td>
            <td class="text-right">Rp {{ number_format($subtotal, 0, ',', '.') }}</td>
        </tr>
        @if($invoice->amount > $subtotal)
        <tr>
            <td>Biaya Transaksi:</td>
            <td class="text-right">Rp {{ number_format($invoice->amount - $subtotal, 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td>TOTAL:</td>
            <td class="text-right">
                @if($invoice->amount == 0)
                GRATIS
                @else
                Rp {{ number_format($invoice->amount, 0, ',', '.') }}
                @endif
            </td>
        </tr>
    </table>

    <div class="payment-info">
        <div class="payment-status">PEMBAYARAN BERHASIL</div>
        <div style="margin-top: 10px; font-size: 11px;">
            <strong>Metode Pembayaran:</strong> {{ $invoice->payment_method ?? 'Tidak diketahui' }}<br>
            @if($invoice->payment_channel)
            <strong>Channel:</strong> {{ $invoice->payment_channel }}<br>
            @endif
            <strong>Tanggal Pembayaran:</strong> {{ \Carbon\Carbon::parse($invoice->paid_at)->format('d M Y H:i') }}
            WIB<br>
            <strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">LUNAS</span>
        </div>
    </div>

    <div class="footer">
        <p><strong>Terima kasih atas kepercayaan Anda!</strong></p>
        <p>Invoice ini adalah bukti pembayaran yang sah dan dihasilkan secara otomatis oleh sistem.</p>
        <p>Untuk pertanyaan lebih lanjut, hubungi customer service kami di {{ $company['email'] }} atau {{
            $company['phone'] }}</p>
        <p style="margin-top: 15px; color: #999;">
            Dicetak pada: {{ \Carbon\Carbon::now()->format('d M Y H:i') }} WIB
        </p>
    </div>
</body>

</html>