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
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }

        return self::updateOrCreate(
            ['key' => $key],
            ['value' => (string)$value]
        );
    }
}
