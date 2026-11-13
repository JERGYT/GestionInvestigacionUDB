<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SublineaInvestigacion extends Model {
    protected $table = 'sublineas_investigacion';
    public $timestamps = false;

    protected $fillable = [
        'linea_id',
        'nombre',
        'activa'
    ];

    public function linea() {
        return $this->belongsTo(LineaInvestigacion::class, 'linea_id');
    }
}
