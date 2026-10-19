// Imagen del bucket de Storage lista para mostrarse en la vista
export interface StorageImage {
  name: string;
  url: string; // URL firmada (el bucket es privado)
  size?: number; // bytes
  createdAt?: string;
}
