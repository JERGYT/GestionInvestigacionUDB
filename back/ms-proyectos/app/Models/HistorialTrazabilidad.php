<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialTrazabilidad extends Model {
    protected $table = 'historial_trazabilidad';

    protected $fillable = [
        'proyecto_id',
        'etapa',
        'estado_anterior',
        'estado_nuevo',
        'actor_id',
        'tipo_evento',
        'observaciones',
        'fecha_evento'
    ];

    public function actor() {
        return $this->belongsTo(Usuario::class, 'actor_id');
    }

    public function proyecto() {
        return $this->belongsTo(Proyecto::class, 'proyecto_id');
    }
}
