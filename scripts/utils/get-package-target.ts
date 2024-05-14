import os from 'os';

const PLATFORM_TO_OS_MAP: {
  [key in NodeJS.Platform]?: 'linux' | 'darwin' | 'win32';
} = {
  aix: 'linux',
  darwin: 'darwin',
  freebsd: 'linux',
  linux: 'linux',
  openbsd: 'linux',
  sunos: 'linux',
  win32: 'win32',
};

const ARCH_MAP: {
  [key in NodeJS.Architecture]: 'arm64' | 'x64';
} = {
  arm: 'arm64',
  arm64: 'arm64',
  ia32: 'x64',
  mips: 'arm64',
  mipsel: 'arm64',
  ppc: 'x64',
  ppc64: 'x64',
  s390: 'x64',
  s390x: 'x64',
  x64: 'x64',
};

export default function getPackageTarget() {
  const osName: 'linux' | 'darwin' | 'win32' =
    PLATFORM_TO_OS_MAP[os.platform()]!;

  const arch = ARCH_MAP[process.arch];

  // darwin-arm64, win32-x64, ...
  return `${osName}-${arch}`;
}
