export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string | null;
          nombre: string;
          perfil: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          nombre: string;
          perfil?: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          nombre?: string;
          perfil?: string;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: any[];
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
          precio: number;
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
        Relationships: any[];
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
        Relationships: any[];
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
          total: number;
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
        Relationships: any[];
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
        Relationships: any[];
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
          created_at: string;
        };
        Insert: {
          id?: string;
          corredor_id: string;
          tipo: string;
          concepto: string;
          monto: number;
          categoria?: string;
          fecha?: string;
          notas?: string | null;
          creado_por?: string | null;
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
          created_at?: string;
        };
        Relationships: any[];
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
          estado: string;
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
        Relationships: any[];
      };
      cliente_notas: {
        Row: {
          id: string;
          cliente_id: string | null;
          corredor_id: string | null;
          nota: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          corredor_id?: string | null;
          nota: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string | null;
          corredor_id?: string | null;
          nota?: string;
          created_at?: string;
        };
        Relationships: any[];
      };
    };
    Views: {};
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_listar_usuarios: {
        Args: Record<string, never>;
        Returns: Array<Database['public']['Tables']['usuarios']['Row']>;
      };
      admin_crear_usuario: {
        Args: {
          p_nombre: string;
          p_email: string;
          p_password: string;
          p_perfil: string;
        };
        Returns: string;
      };
      admin_set_activo: {
        Args: {
          p_user_id: string;
          p_activo: boolean;
        };
        Returns: undefined;
      };
      admin_set_password: {
        Args: {
          p_user_id: string;
          p_password: string;
        };
        Returns: undefined;
      };
    };
    Enums: {};
  };
}
