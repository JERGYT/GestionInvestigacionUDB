<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineaInvestigacion extends Model {
    protected $table = 'lineas_investigacion';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'activa'
    ];

    public function sublineas() {
        return $this->hasMany(SublineaInvestigacion::class, 'linea_id');
    }
}
