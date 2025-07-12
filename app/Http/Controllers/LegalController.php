<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class LegalController extends Controller
{
    public function termsAndConditions()
    {
        return Inertia::render('legal/terms-and-conditions');
    }

    public function privacyPolicy()
    {
        return Inertia::render('legal/privacy-policy');
    }
}
