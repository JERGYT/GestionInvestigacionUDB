<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProyectoInvestigador extends Model {
    protected $table = 'proyecto_investigadores';

    protected $fillable = [
        'proyecto_id',
        'usuario_id',
        'rol_equipo',
        'activo',
        'fecha_vinculacion',
        'fecha_retiro'
    ];

    public function usuario() {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function proyecto() {
        return $this->belongsTo(Proyecto::class, 'proyecto_id');
    }
}
