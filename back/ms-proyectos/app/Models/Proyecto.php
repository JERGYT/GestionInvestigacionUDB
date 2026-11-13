<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model {
    protected $table = 'proyectos';

    protected $fillable = [
        'titulo',
        'resumen',
        'linea_id',
        'sublinea_id',
        'investigador_principal_id',
        'etapa_actual',
        'estado_actual',
        'rondas_revision',
        'fecha_radicacion',
        'fecha_asignacion_pares'
    ];

    public function linea() {
        return $this->belongsTo(LineaInvestigacion::class, 'linea_id');
    }

    public function sublinea() {
        return $this->belongsTo(SublineaInvestigacion::class, 'sublinea_id');
    }

    public function investigadorPrincipal() {
        return $this->belongsTo(Usuario::class, 'investigador_principal_id');
    }

    public function equipo() {
        return $this->hasMany(ProyectoInvestigador::class, 'proyecto_id')
            ->orderBy('activo', 'desc')
            ->orderBy('id', 'asc');
    }

    public function trazabilidad() {
        return $this->hasMany(HistorialTrazabilidad::class, 'proyecto_id')
            ->orderBy('fecha_evento', 'desc')
            ->orderBy('id', 'desc');
    }

    public function evaluacionesPares() {
        return $this->hasMany(EvaluacionPar::class, 'proyecto_id')
            ->orderBy('ronda', 'desc')
            ->orderBy('id', 'asc');
    }
}
