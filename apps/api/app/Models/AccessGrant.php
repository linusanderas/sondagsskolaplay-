<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AccessGrant extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'grantable_type',
        'grantable_id',
        'notes',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function grantable(): MorphTo
    {
        return $this->morphTo();
    }
}
