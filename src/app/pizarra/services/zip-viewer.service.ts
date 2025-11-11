import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import JSZip from 'jszip';

export interface ZipFileEntry {
  path: string;
  content: string; // textual content (or base64 for binaries)
  isBinary: boolean;
}

@Injectable({ providedIn: 'root' })
export class ZipViewerService {
  public files$ = new BehaviorSubject<ZipFileEntry[]>([]);
  public currentFile$ = new BehaviorSubject<ZipFileEntry | null>(null);

  constructor() {}

  async loadZip(blob: Blob) {
    const jszip = await JSZip.loadAsync(blob);
    const entries: ZipFileEntry[] = [];

    const names = Object.keys(jszip.files).sort();
    for (const name of names) {
      const file = jszip.files[name];
      if (file.dir) continue;
      try {
        // Try to read as text
        const text = await file.async('string');
        entries.push({ path: name, content: text, isBinary: false });
      } catch (err) {
        // If not text, load as uint8array and encode as base64
        try {
          const arr = await file.async('uint8array');
          let binary = '';
          for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
          const b64 = btoa(binary);
          entries.push({ path: name, content: b64, isBinary: true });
        } catch (e) {
          // fallback: skip
        }
      }
    }

    this.files$.next(entries);
    this.currentFile$.next(entries.length ? entries[0] : null);
  }

  selectFile(path: string) {
    const files = this.files$.value;
    const found = files.find(f => f.path === path) || null;
    this.currentFile$.next(found);
  }

  clear() {
    this.files$.next([]);
    this.currentFile$.next(null);
  }
}
