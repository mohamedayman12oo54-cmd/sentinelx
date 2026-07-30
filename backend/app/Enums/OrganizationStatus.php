<?php

namespace App\Enums;

enum CompanyStatus: string
{
    case Active = 'ACTIVE';
    case Suspended = 'SUSPENDED';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
