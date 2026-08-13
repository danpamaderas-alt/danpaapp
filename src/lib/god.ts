import type { Usuario } from './corredor';

export const GOD_MODE = false;

export const GOD_CORREDOR_ID = '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c';

export const godUsuario: Usuario = {
  id: GOD_CORREDOR_ID,
  email: 'danpamaderas@gmail.com',
  nombre: 'God Mode (danpamaderas)',
  perfil: 'admin',
  activo: true,
  created_at: new Date().toISOString(),
};