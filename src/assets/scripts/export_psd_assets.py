from pathlib import Path
from psd_tools import PSDImage

ROOT = Path('/home/ubuntu/playable-ads-parking')
UPLOAD_DIR = Path('/home/ubuntu/upload')
OUTPUT_DIR = ROOT / 'public' / 'assets'

FILES = {
    'Button.psd': 'button.png',
    'fail3.psd': 'fail.png',
    'TP_car_up.psd': 'car_top.png',
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for source_name, target_name in FILES.items():
    source_path = UPLOAD_DIR / source_name
    if not source_path.exists():
        raise FileNotFoundError(f'Missing asset: {source_path}')

    psd = PSDImage.open(source_path)
    composed = psd.composite()
    if composed is None:
        raise RuntimeError(f'Unable to composite PSD: {source_path}')

    composed.save(OUTPUT_DIR / target_name)
    print(f'Exported {source_name} -> {OUTPUT_DIR / target_name}')
