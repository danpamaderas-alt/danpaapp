export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Notificacion = Database['public']['Tables']['notificaciones']['Row'];

export interface NuevaNotificacion {
  corredor_id: string;
  tipo: TipoNotificacion;
  nivel: NivelNotificacion;
  titulo: string;
  mensaje: string;
  enlace?: string;
  dato_referencia?: string;
  leido: boolean;
  creado_en?: string;
}

export type TipoNotificacion = 'stock_bajo' | 'agenda_proxima' | 'pago_pendiente' | 'mantenimiento';
export type NivelNotificacion = 'info' | 'warning' | 'error' | 'success';

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          perfil: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          perfil?: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          perfil?: string;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
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
          tipo: string;
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
          tipo: string;
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
          tipo?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, { Args: any; Returns: any }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
