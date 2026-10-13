<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    /**
     * Get a setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::find($key);
        if (!$setting) {
            return $default;
        }

        $value = $setting->value;

        // Auto cast numeric or boolean values
        if ($value === 'true') return true;
        if ($value === 'false') return false;
        if (is_numeric($value)) {
            return strpos($value, '.') !== false ? (float)$value : (int)$value;
        }

        // Auto decode JSON if valid
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
            return $decoded;
        }

        return $value;
    }

    /**
     * Set a setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @return self
     */
    public static function set(string $key, $value)
    {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        } elseif (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }

        return self::updateOrCreate(
            ['key' => $key],
            ['value' => (string)$value]
        );
    }

    /**
     * Get referral settings for all product programs.
     *
     * @return array
     */
    public static function getReferralProgramSettings(): array
    {
        $defaultReferrer = (int) self::get('referral_reward', 5000);
        $defaultBuyer = (int) self::get('buyer_reward', 2000);

        $defaultProgramConfig = [
            'certification_program' => [
                'name' => 'Program Sertifikasi',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
            'bootcamp' => [
                'name' => 'Bootcamp',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
            'course' => [
                'name' => 'Kelas Online',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
            'webinar' => [
                'name' => 'Webinar',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
            'bundle' => [
                'name' => 'Paket Bundling',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
            'private' => [
                'name' => 'Kelas Privat',
                'is_enabled' => true,
                'referrer_reward_type' => 'fixed',
                'referrer_rate' => $defaultReferrer,
                'referrer_max_reward' => null,
                'buyer_reward_type' => 'fixed',
                'buyer_rate' => $defaultBuyer,
                'buyer_max_reward' => null,
            ],
        ];

        $saved = self::get('referral_program_settings');
        if (is_string($saved)) {
            $saved = json_decode($saved, true);
        }

        if (!is_array($saved)) {
            return $defaultProgramConfig;
        }

        foreach ($defaultProgramConfig as $key => $defaultValues) {
            if (isset($saved[$key]) && is_array($saved[$key])) {
                $defaultProgramConfig[$key] = array_merge($defaultValues, $saved[$key]);
            }
        }

        return $defaultProgramConfig;
    }
}
