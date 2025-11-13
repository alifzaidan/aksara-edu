<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentBundle extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }

    public function createIndividualEnrollments()
    {
        $bundle = $this->bundle;
        $userId = $this->invoice->user_id;

        foreach ($bundle->bundleItems as $item) {
            $bundleable = $item->bundleable;

            switch ($item->bundleable_type) {
                case Course::class:
                    EnrollmentCourse::firstOrCreate([
                        'invoice_id' => $this->invoice_id,
                        'course_id' => $bundleable->id,
                    ], [
                        'price' => $item->price,
                        'progress' => 0,
                    ]);
                    break;

                case Bootcamp::class:
                    EnrollmentBootcamp::firstOrCreate([
                        'invoice_id' => $this->invoice_id,
                        'bootcamp_id' => $bundleable->id,
                    ], [
                        'price' => $item->price,
                        'progress' => 0,
                    ]);
                    break;

                case Webinar::class:
                    EnrollmentWebinar::firstOrCreate([
                        'invoice_id' => $this->invoice_id,
                        'webinar_id' => $bundleable->id,
                    ], [
                        'price' => $item->price,
                    ]);
                    break;
            }
        }
    }
}
