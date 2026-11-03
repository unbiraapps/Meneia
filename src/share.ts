// Solo en la app de Android: guarda la copia en un archivo y abre "Compartir" (Drive, WhatsApp, mail...).
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share as CapShare } from '@capacitor/share';

export async function Share(name: string, text: string): Promise<void> {
  const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await CapShare.share({ title: 'Copia de Mi Ciclo', text: 'Copia de seguridad de Mi Ciclo', url: res.uri, dialogTitle: 'Guardar copia' });
}
