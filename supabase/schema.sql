-- =====================================================================
-- Script SQL del laboratorio (versión del profesor, ya ejecutada en
-- Supabase > SQL Editor). Se guarda aquí como referencia.
-- =====================================================================

-- 1. Crear enumeración de roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- 2. Crear tabla de perfiles (vinculada a autenticación)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'user' NOT NULL
);

-- 3. Crear tabla de clientes
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para Perfiles (Lectura propia)
CREATE POLICY "Leer perfil propio" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 6. Políticas para Clientes (RBAC)
CREATE POLICY "Lectura para autenticados" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Escritura solo para admins" ON public.clients
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================================
-- Pasos posteriores
-- =====================================================================

-- Borrar la tabla antigua de pruebas (irreversible):
-- DROP TABLE IF EXISTS public.clientes;

-- Tras crear un usuario en Authentication > Users, darle rol admin
-- (este script no crea el perfil automáticamente):
-- INSERT INTO public.profiles (id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'tu-email@ejemplo.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
