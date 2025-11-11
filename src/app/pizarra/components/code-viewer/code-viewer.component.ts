import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZipViewerService } from '../../services/zip-viewer.service';
import { DartpadService } from '../../services/dartpad.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './code-viewer.component.html',
  styleUrls: ['./code-viewer.component.css']
})
export class CodeViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() zipBlob?: Blob | null;
  @Output() close = new EventEmitter<void>();
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dartpad') dartpadFrame!: ElementRef<HTMLIFrameElement>;

  files: any[] = [];
  currentFile: any = null;
  // Estructura de árbol generada a partir de paths
  tree: any[] = [];
  showDartpad = false;
  isFlutterProject = false;
  consolidatedCode = '';
  private subs: Subscription[] = [];
  private monaco: any = null;
  private editor: any = null;

  constructor(
    private zipViewer: ZipViewerService,
    private dartpadService: DartpadService
  ) {}

  ngOnInit(): void {
    this.subs.push(this.zipViewer.files$.subscribe(files => {
      this.files = files;
      this.buildTree(files.map(f => f.path));
      
      // Detectar si es proyecto Flutter
      this.isFlutterProject = this.dartpadService.isFlutterProject(files);
      if (this.isFlutterProject) {
        this.consolidatedCode = this.dartpadService.consolidateDartProject(files);
      }
    }));
    this.subs.push(this.zipViewer.currentFile$.subscribe(file => {
      this.currentFile = file;
      this.updateEditorContent();
    }));

    if (this.zipBlob) {
      this.zipViewer.loadZip(this.zipBlob);
    }

    // Cargar Monaco dinámicamente
    import('monaco-editor').then(monaco => {
      this.monaco = monaco;
      this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
        value: this.currentFile ? (this.currentFile.isBinary ? '' : this.currentFile.content) : '',
        language: 'text',
        automaticLayout: true,
        minimap: { enabled: false }
      });
    }).catch(err => {
      console.warn('Monaco no pudo cargarse:', err);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    try { this.editor?.dispose(); } catch (e) {}
  }

  ngAfterViewInit(): void {
    if (!this.dartpadFrame) return;
    const iframe = this.dartpadFrame.nativeElement;
    iframe.onload = () => {
      console.log('DartPad iframe cargado');
      // Enviar código cuando el iframe esté listo
      setTimeout(() => this.sendCodeToDartpad(), 500);
    };
  }

  async openBlob(blob: Blob) {
    await this.zipViewer.loadZip(blob);
  }

  selectFile(path: string) {
    this.zipViewer.selectFile(path);
  }

  toggleFolder(node: any, event?: MouseEvent) {
    if (event) { event.stopPropagation(); }
    node.expanded = !node.expanded;
  }

  private buildTree(paths: string[]) {
    const root: any[] = [];

    const findOrCreate = (children: any[], name: string) => {
      let n = children.find(c => c.name === name);
      if (!n) {
        n = { name, children: [], isDir: true, expanded: false, path: '' };
        children.push(n);
      }
      return n;
    };

    for (const p of paths) {
      const parts = p.split('/').filter(Boolean);
      let cursor = root;
      let accumulated = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        accumulated = accumulated ? `${accumulated}/${part}` : part;
        const isLeaf = (i === parts.length - 1);
        if (isLeaf) {
          cursor.push({ name: part, isDir: false, path: accumulated });
        } else {
          const next = findOrCreate(cursor, part);
          // set path for folder
          next.path = accumulated;
          cursor = next.children;
        }
      }
    }

    // Sort folders then files
    const sortNodes = (nodes: any[]) => {
      nodes.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(n => { if (n.isDir) sortNodes(n.children); });
    };
    sortNodes(root);
    this.tree = root;
  }

  private updateEditorContent() {
    if (!this.editor || !this.monaco) return;
    if (!this.currentFile) {
      this.editor.setValue('');
      return;
    }

    if (this.currentFile.isBinary) {
      // Show base64 placeholder for binaries
      this.editor.setValue(`-- archivo binario (base64) --\n${this.currentFile.content}`);
      this.monaco.editor.setModelLanguage(this.editor.getModel(), 'plaintext');
      return;
    }

    this.editor.setValue(this.currentFile.content || '');
    const lang = this.detectLanguageFromPath(this.currentFile.path);
    try {
      this.monaco.editor.setModelLanguage(this.editor.getModel(), lang);
    } catch (e) {
      // ignore
    }
  }

  private detectLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'java': return 'java';
      case 'kt': return 'kotlin';
      case 'xml': return 'xml';
      case 'yml':
      case 'yaml': return 'yaml';
      case 'json': return 'json';
      case 'properties': return 'properties';
      case 'md': return 'markdown';
      case 'html': return 'html';
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      default: return 'plaintext';
    }
  }

  isDartFile(): boolean {
    return this.currentFile?.path?.toLowerCase().endsWith('.dart') || false;
  }

  openInDartpad() {
    if (!this.isFlutterProject) return;
    this.showDartpad = true;
    // Esperar a que el iframe se renderice y luego enviar el código consolidado
    setTimeout(() => this.sendCodeToDartpad(), 300);
  }

  sendCodeToDartpad() {
    if (!this.dartpadFrame || !this.consolidatedCode) return;
    const iframe = this.dartpadFrame.nativeElement;
    try {
      console.log('Enviando código consolidado a DartPad');
      iframe.contentWindow?.postMessage(
        {
          sourceCode: this.consolidatedCode,
          type: 'sourceCode',
          snippetType: 'flutter',
        },
        '*'
      );
    } catch (err) {
      console.error('Error al enviar código a DartPad:', err);
    }
  }

  closeDartpad() {
    this.showDartpad = false;
  }

  onClose() { this.close.emit(); }
}
