<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluacionPar extends Model {
    protected $table = 'evaluaciones_pares';

    protected $fillable = [
        'proyecto_id',
        'par_usuario_id',
        'etapa_evaluada',
        'ronda',
        'fecha_asignacion',
        'fecha_concepto',
        'veredicto',
        'concepto_observaciones'
    ];

    public function par() {
        return $this->belongsTo(Usuario::class, 'par_usuario_id');
    }

    public function proyecto() {
        return $this->belongsTo(Proyecto::class, 'proyecto_id');
    }
}
