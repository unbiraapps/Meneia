import { describe, expect, it } from 'vitest';
import { deriveKey, newSalt, open, parseEnvelope, seal, sha256Hex } from '../src/crypt';

describe('copia cifrada', () => {
  it('cifra y descifra con la misma contraseña', async () => {
    const salt = newSalt();
    const key = await deriveKey('lila de noche', salt, 100_000);
    const env = await seal('{"hola":"ciclo"}', key, salt, 100_000);
    expect(env.ct).not.toContain('ciclo');
    const again = await deriveKey('lila de noche', env.salt, env.iter);
    expect(await open(env, again)).toBe('{"hola":"ciclo"}');
  });

  it('con otra contraseña no se puede abrir', async () => {
    const salt = newSalt();
    const env = await seal('secreto', await deriveKey('correcta1', salt, 100_000), salt, 100_000);
    expect(await open(env, await deriveKey('incorrecta', salt, 100_000))).toBeNull();
  });

  it('cada copia usa un iv distinto', async () => {
    const salt = newSalt();
    const key = await deriveKey('abcdefgh', salt, 100_000);
    const a = await seal('x', key, salt, 100_000), b = await seal('x', key, salt, 100_000);
    expect(a.iv).not.toBe(b.iv);
  });

  it('reconoce solo sobres válidos', async () => {
    const salt = newSalt();
    const env = await seal('x', await deriveKey('abcdefgh', salt, 100_000), salt, 100_000);
    expect(parseEnvelope(JSON.stringify(env))).toEqual(env);
    expect(parseEnvelope('{"app":"otra"}')).toBeNull();
    expect(parseEnvelope(JSON.stringify({ ...env, iter: 10 }))).toBeNull();
    expect(parseEnvelope('no es json')).toBeNull();
  });

  it('sha256 en hex para el nonce de Google', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
