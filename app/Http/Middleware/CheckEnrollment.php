<?php

namespace App\Http\Middleware;

use App\Models\Invoice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckEnrollment
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $course = $request->route('course');
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $isEnrolled = Invoice::where('user_id', $user->id)
            ->where('status', 'paid')
            ->whereHas('courseItems', function ($query) use ($course) {
                $query->where('course_id', $course->id);
            })
            ->exists();

        if (!$isEnrolled) {
            return redirect()->route('course.detail', $course->slug)->with('error', 'Anda belum terdaftar di kelas ini.');
        }

        return $next($request);
    }
}
