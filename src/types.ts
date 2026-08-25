export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface AgendaTarea {
  id: string;
  texto: string;
  hecho: boolean;
}

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          apellido: string | null;
          perfil: string;
          activo: boolean;
          corredor_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          apellido?: string | null;
          perfil?: string;
          activo?: boolean;
          corredor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          apellido?: string | null;
          perfil?: string;
          activo?: boolean;
          corredor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: string;
          corredor_id: string | null;
          nombre: string;
          descripcion: string | null;
          precio: number;
          stock: number;
          activo: boolean;
          imagen_url: string | null;
          categoria: string;
          stock_minimo: number;
          costo: number;
          costo_adquisicion: number;
          costo_transporte: number;
          costo_empaque: number;
          costo_almacenaje: number;
          costo_almacenamiento: number;
          costo_comision: number;
          costo_otros: number;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id?: string | null;
          nombre: string;
          descripcion?: string | null;
          precio?: number;
          stock?: number;
          activo?: boolean;
          imagen_url?: string | null;
          categoria?: string;
          stock_minimo?: number;
          costo?: number;
          costo_adquisicion?: number;
          costo_transporte?: number;
          costo_empaque?: number;
          costo_almacenaje?: number;
          costo_almacenamiento?: number;
          costo_comision?: number;
          costo_otros?: number;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string | null;
          nombre?: string;
          descripcion?: string | null;
          precio?: number;
          stock?: number;
          activo?: boolean;
          imagen_url?: string | null;
          categoria?: string;
          stock_minimo?: number;
          costo?: number;
          costo_adquisicion?: number;
          costo_transporte?: number;
          costo_empaque?: number;
          costo_almacenaje?: number;
          costo_almacenamiento?: number;
          costo_comision?: number;
          costo_otros?: number;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pedido_items_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'pedido_items';
            referencedColumns: ['id'];
          }
        ];
      };
      clientes: {
        Row: {
          id: string;
          corredor_id: string;
          nombre: string;
          telefono: string | null;
          direccion: string | null;
          notas: string | null;
          latitud: number | null;
          longitud: number | null;
          tipo_cliente: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          nombre: string;
          telefono?: string | null;
          direccion?: string | null;
          notas?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          tipo_cliente?: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          nombre?: string;
          telefono?: string | null;
          direccion?: string | null;
          notas?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          tipo_cliente?: string;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clientes_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedidos_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visitas_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'visitas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cliente_notas_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'cliente_notas';
            referencedColumns: ['id'];
          }
        ];
      };
      pedidos: {
        Row: {
          id: string;
          corredor_id: string;
          cliente_id: string | null;
          total: number;
          descuento: number;
          vendedor_id: string | null;
          creado_por: string | null;
          notas: string | null;
          estado: string;
          estado_pago: string;
          monto_pagado: number;
          tipo_pago: string | null;
          fecha_pago: string | null;
          referencia_pago: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          cliente_id?: string | null;
          total?: number;
          descuento?: number;
          vendedor_id?: string | null;
          creado_por?: string | null;
          notas?: string | null;
          estado?: string;
          estado_pago?: string;
          monto_pagado?: number;
          tipo_pago?: string | null;
          fecha_pago?: string | null;
          referencia_pago?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          cliente_id?: string | null;
          total?: number;
          descuento?: number;
          vendedor_id?: string | null;
          creado_por?: string | null;
          notas?: string | null;
          estado?: string;
          estado_pago?: string;
          monto_pagado?: number;
          tipo_pago?: string | null;
          fecha_pago?: string | null;
          referencia_pago?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pedidos_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedidos_vendedor_id_fkey';
            columns: ['vendedor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedidos_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedido_items_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedido_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'movimientos_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'movimientos';
            referencedColumns: ['id'];
          }
        ];
      };
      pedido_items: {
        Row: {
          id: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          producto_id?: string;
          cantidad?: number;
          precio_unitario?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pedido_items_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedido_items_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'productos';
            referencedColumns: ['id'];
          }
        ];
      };
      movimientos: {
        Row: {
          id: string;
          corredor_id: string;
          concepto: string;
          monto: number;
          categoria: string;
          fecha: string;
          notas: string | null;
          creado_por: string | null;
          pedido_id: string | null;
          pagador: string | null;
          cuenta: string | null;
          tiene_factura: boolean;
          nro_factura: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          concepto: string;
          monto?: number;
          categoria?: string;
          fecha?: string;
          notas?: string | null;
          creado_por?: string | null;
          pedido_id?: string | null;
          pagador?: string | null;
          cuenta?: string | null;
          tiene_factura?: boolean;
          nro_factura?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          concepto?: string;
          monto?: number;
          categoria?: string;
          fecha?: string;
          notas?: string | null;
          creado_por?: string | null;
          pedido_id?: string | null;
          pagador?: string | null;
          cuenta?: string | null;
          tiene_factura?: boolean;
          nro_factura?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'movimientos_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'movimientos_creado_por_fkey';
            columns: ['creado_por'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'movimientos_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          }
        ];
      };
      movimientos_opciones: {
        Row: {
          id: string;
          corredor_id: string;
          tipo: string;
          valor: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          tipo: string;
          valor: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          tipo?: string;
          valor?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'movimientos_opciones_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      notificaciones: {
        Row: {
          id: string;
          corredor_id: string;
          tipo: string;
          nivel: string;
          titulo: string;
          mensaje: string;
          enlace: string | null;
          dato_referencia: string | null;
          agenda_id: string | null;
          leido: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          tipo: string;
          nivel: string;
          titulo: string;
          mensaje: string;
          enlace?: string | null;
          dato_referencia?: string | null;
          agenda_id?: string | null;
          leido: boolean;
          creado_en?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          tipo?: string;
          nivel?: string;
          titulo?: string;
          mensaje?: string;
          enlace?: string | null;
          dato_referencia?: string | null;
          agenda_id?: string | null;
          leido?: boolean;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notificaciones_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notificaciones_agenda_id_fkey';
            columns: ['agenda_id'];
            isOneToOne: false;
            referencedRelation: 'agenda';
            referencedColumns: ['id'];
          }
        ];
      };
      visitas: {
        Row: {
          id: string;
          corredor_id: string;
          cliente_id: string | null;
          fecha: string;
          estado: string;
          latitud: number | null;
          longitud: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          cliente_id?: string | null;
          fecha?: string;
          estado?: string;
          latitud?: number | null;
          longitud?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          cliente_id?: string | null;
          fecha?: string;
          estado?: string;
          latitud?: number | null;
          longitud?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'visitas_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visitas_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          }
        ];
      };
      cliente_notas: {
        Row: {
          id: string;
          cliente_id: string;
          corredor_id: string;
          nota: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          corredor_id: string;
          nota: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          corredor_id?: string;
          nota?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cliente_notas_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cliente_notas_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      agenda: {
        Row: {
          id: string;
          corredor_id: string;
          tipo: string;
          titulo: string;
          organismo: string | null;
          monto: number;
          fecha: string | null;
          hora: string | null;
          hora_fin: string | null;
          lugar: string | null;
          prioridad: string | null;
          color: string | null;
          recurrencia: string | null;
          tareas: AgendaTarea[] | null;
          dias_aviso: number | null;
          estado: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          tipo: string;
          titulo: string;
          organismo?: string | null;
          monto?: number;
          fecha?: string | null;
          hora?: string | null;
          hora_fin?: string | null;
          lugar?: string | null;
          prioridad?: string | null;
          color?: string | null;
          recurrencia?: string | null;
          tareas?: AgendaTarea[] | null;
          dias_aviso?: number | null;
          estado?: string;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          tipo?: string;
          titulo?: string;
          organismo?: string | null;
          monto?: number;
          fecha?: string | null;
          hora?: string | null;
          hora_fin?: string | null;
          lugar?: string | null;
          prioridad?: string | null;
          color?: string | null;
          recurrencia?: string | null;
          tareas?: AgendaTarea[] | null;
          dias_aviso?: number | null;
          estado?: string;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agenda_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      podas: {
        Row: {
          id: string;
          corredor_id: string;
          cantidad_arboles: number;
          detalle: string;
          tipo_arbol: string | null;
          tipo_poda: string | null;
          lugar: string | null;
          fecha: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          cantidad_arboles?: number;
          detalle: string;
          tipo_arbol?: string | null;
          tipo_poda?: string | null;
          lugar?: string | null;
          fecha?: string;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          cantidad_arboles?: number;
          detalle?: string;
          tipo_arbol?: string | null;
          tipo_poda?: string | null;
          lugar?: string | null;
          fecha?: string;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'podas_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      empleados: {
        Row: {
          id: string;
          corredor_id: string;
          nombre: string;
          telefono: string | null;
          dni: string | null;
          direccion: string | null;
          puesto: string | null;
          salario: number;
          fecha_ingreso: string | null;
          tipo_liquidacion: string;
          activo: boolean;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          nombre: string;
          telefono?: string | null;
          dni?: string | null;
          direccion?: string | null;
          puesto?: string | null;
          salario?: number;
          fecha_ingreso?: string | null;
          tipo_liquidacion?: string;
          activo?: boolean;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          nombre?: string;
          telefono?: string | null;
          dni?: string | null;
          direccion?: string | null;
          puesto?: string | null;
          salario?: number;
          fecha_ingreso?: string | null;
          tipo_liquidacion?: string;
          activo?: boolean;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'empleados_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      asistencias: {
        Row: {
          id: string;
          corredor_id: string;
          empleado_id: string;
          fecha: string;
          hora_entrada: string | null;
          hora_salida: string | null;
          estado: string;
          horas_extra: number;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          empleado_id: string;
          fecha?: string;
          hora_entrada?: string | null;
          hora_salida?: string | null;
          estado?: string;
          horas_extra?: number;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          empleado_id?: string;
          fecha?: string;
          hora_entrada?: string | null;
          hora_salida?: string | null;
          estado?: string;
          horas_extra?: number;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'asistencias_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'asistencias_empleado_id_fkey';
            columns: ['empleado_id'];
            isOneToOne: false;
            referencedRelation: 'empleados';
            referencedColumns: ['id'];
          }
        ];
      };
      licencias: {
        Row: {
          id: string;
          corredor_id: string;
          empleado_id: string;
          tipo: string;
          fecha_desde: string;
          fecha_hasta: string;
          estado: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          empleado_id: string;
          tipo: string;
          fecha_desde: string;
          fecha_hasta: string;
          estado?: string;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          empleado_id?: string;
          tipo?: string;
          fecha_desde?: string;
          fecha_hasta?: string;
          estado?: string;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'licencias_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'licencias_empleado_id_fkey';
            columns: ['empleado_id'];
            isOneToOne: false;
            referencedRelation: 'empleados';
            referencedColumns: ['id'];
          }
        ];
      };
      liquidaciones: {
        Row: {
          id: string;
          corredor_id: string;
          empleado_id: string;
          periodo: string;
          monto: number;
          estado: string;
          fecha_pago: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          empleado_id: string;
          periodo: string;
          monto?: number;
          estado?: string;
          fecha_pago?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          empleado_id?: string;
          periodo?: string;
          monto?: number;
          estado?: string;
          fecha_pago?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'liquidaciones_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidaciones_empleado_id_fkey';
            columns: ['empleado_id'];
            isOneToOne: false;
            referencedRelation: 'empleados';
            referencedColumns: ['id'];
          }
        ];
      };
      contratistas: {
        Row: {
          id: string;
          corredor_id: string;
          nombre: string;
          telefono: string | null;
          dni: string | null;
          especialidad: string | null;
          tarifa: number;
          tipo_tarifa: string;
          activo: boolean;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          nombre: string;
          telefono?: string | null;
          dni?: string | null;
          especialidad?: string | null;
          tarifa?: number;
          tipo_tarifa?: string;
          activo?: boolean;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          nombre?: string;
          telefono?: string | null;
          dni?: string | null;
          especialidad?: string | null;
          tarifa?: number;
          tipo_tarifa?: string;
          activo?: boolean;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contratistas_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          }
        ];
      };
      contratista_trabajos: {
        Row: {
          id: string;
          corredor_id: string;
          contratista_id: string;
          descripcion: string;
          lugar: string | null;
          fecha: string;
          costo: number;
          estado: string;
          fecha_pago: string | null;
          nro_contrato: string | null;
          nro_remito: string | null;
          arboles: number | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          contratista_id: string;
          descripcion: string;
          lugar?: string | null;
          fecha?: string;
          costo?: number;
          estado?: string;
          fecha_pago?: string | null;
          nro_contrato?: string | null;
          nro_remito?: string | null;
          arboles?: number | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          contratista_id?: string;
          descripcion?: string;
          lugar?: string | null;
          fecha?: string;
          costo?: number;
          estado?: string;
          fecha_pago?: string | null;
          nro_contrato?: string | null;
          nro_remito?: string | null;
          arboles?: number | null;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contratista_trabajos_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contratista_trabajos_contratista_id_fkey';
            columns: ['contratista_id'];
            isOneToOne: false;
            referencedRelation: 'contratistas';
            referencedColumns: ['id'];
          }
        ];
      };
      contratista_pagos: {
        Row: {
          id: string;
          corredor_id: string;
          contratista_id: string;
          trabajo_id: string;
          monto: number;
          fecha: string;
          medio_pago: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          contratista_id: string;
          trabajo_id: string;
          monto: number;
          fecha?: string;
          medio_pago?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          contratista_id?: string;
          trabajo_id?: string;
          monto?: number;
          fecha?: string;
          medio_pago?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contratista_pagos_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contratista_pagos_contratista_id_fkey';
            columns: ['contratista_id'];
            isOneToOne: false;
            referencedRelation: 'contratistas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contratista_pagos_trabajo_id_fkey';
            columns: ['trabajo_id'];
            isOneToOne: false;
            referencedRelation: 'contratista_trabajos';
            referencedColumns: ['id'];
          }
        ];
      };
      contratista_eventos: {
        Row: {
          id: string;
          corredor_id: string;
          contratista_id: string;
          trabajo_id: string | null;
          tipo: string;
          descripcion: string;
          monto: number | null;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          contratista_id: string;
          trabajo_id?: string | null;
          tipo?: string;
          descripcion: string;
          monto?: number | null;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          corredor_id?: string;
          contratista_id?: string;
          trabajo_id?: string | null;
          tipo?: string;
          descripcion?: string;
          monto?: number | null;
          fecha?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contratista_eventos_corredor_id_fkey';
            columns: ['corredor_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contratista_eventos_contratista_id_fkey';
            columns: ['contratista_id'];
            isOneToOne: false;
            referencedRelation: 'contratistas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contratista_eventos_trabajo_id_fkey';
            columns: ['trabajo_id'];
            isOneToOne: false;
            referencedRelation: 'contratista_trabajos';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, { Args: any; Returns: any }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
