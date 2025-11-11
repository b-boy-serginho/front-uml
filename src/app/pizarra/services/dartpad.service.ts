import { Injectable } from '@angular/core';
import { ZipFileEntry } from './zip-viewer.service';

@Injectable({ providedIn: 'root' })
export class DartpadService {
  /**
   * Detecta si el ZIP contiene una estructura Flutter/Dart
   * Busca: frontend/lib/main.dart o similar
   */
  isFlutterProject(files: ZipFileEntry[]): boolean {
    return files.some(f => 
      f.path.toLowerCase().includes('lib/main.dart') ||
      f.path.toLowerCase().includes('pubspec.yaml') ||
      f.path.toLowerCase().includes('pubspec.yml')
    );
  }

  /**
   * Consolida todos los archivos Dart de la carpeta lib en un solo archivo
   * Remueve imports entre archivos del proyecto
   */
  consolidateDartProject(files: ZipFileEntry[]): string {
    // Encontrar la carpeta lib (puede ser frontend/lib o similar)
    const libPath = this.findLibPath(files);
    if (!libPath) {
      return '// No se encontró la carpeta lib\nvoid main() {}';
    }

    // Filtrar solo archivos .dart dentro de lib
    const dartFiles = files.filter(f => 
      f.path.toLowerCase().startsWith(libPath) && 
      f.path.toLowerCase().endsWith('.dart') &&
      !f.isBinary
    );

    if (dartFiles.length === 0) {
      return '// No se encontraron archivos Dart\nvoid main() {}';
    }

    // Separar main.dart del resto
    const mainFile = dartFiles.find(f => f.path.toLowerCase().endsWith('main.dart'));
    const otherFiles = dartFiles.filter(f => !f.path.toLowerCase().endsWith('main.dart'));

    // Extraer imports necesarios del proyecto (solo los de package: y dart:)
    const essentialImports = this.extractEssentialImports(dartFiles);

    // Construir el código consolidado
    let consolidatedCode = '// ===== CÓDIGO CONSOLIDADO DE FLUTTER =====\n\n';
    
    // Agregar solo imports esenciales al inicio
    consolidatedCode += essentialImports.join('\n');
    if (essentialImports.length > 0) {
      consolidatedCode += '\n\n';
    }

    // Agregar contenido de otros archivos (sin sus imports)
    for (const file of otherFiles) {
      consolidatedCode += `// ===== Archivo: ${file.path} =====\n`;
      consolidatedCode += this.removeAllImports(file.content);
      consolidatedCode += '\n\n';
    }

    // Agregar main.dart al final (sin sus imports)
    if (mainFile) {
      consolidatedCode += '// ===== MAIN (PUNTO DE ENTRADA) =====\n';
      consolidatedCode += this.removeAllImports(mainFile.content);
    }

    return consolidatedCode;
  }

  /**
   * Encuentra la ruta de la carpeta lib
   */
  private findLibPath(files: ZipFileEntry[]): string | null {
    const libFile = files.find(f => 
      f.path.toLowerCase().includes('/lib/')
    );
    
    if (!libFile) return null;
    
    // Extraer la ruta hasta /lib/
    const match = libFile.path.match(/^(.*\/lib)\//i);
    return match ? match[1] : null;
  }

  /**
   * Extrae solo los imports esenciales (package: y dart:)
   */
  private extractEssentialImports(files: ZipFileEntry[]): string[] {
    const importSet = new Set<string>();

    for (const file of files) {
      const lines = file.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Solo mantener imports de package: y dart:
        if ((trimmed.startsWith("import 'package:") || 
             trimmed.startsWith('import "package:') ||
             trimmed.startsWith("import 'dart:") ||
             trimmed.startsWith('import "dart:')) && 
            trimmed.endsWith(';')) {
          importSet.add(trimmed);
        }
      }
    }

    return Array.from(importSet).sort();
  }

  /**
   * Remueve TODOS los imports de un archivo
   */
  private removeAllImports(code: string): string {
    const lines = code.split('\n');
    
    return lines
      .filter(line => {
        const trimmed = line.trim();
        // Remover cualquier línea que comience con import
        if (trimmed.startsWith('import ')) {
          return false;
        }
        return true;
      })
      .join('\n')
      .replace(/^\s*\n+/gm, '') // Remover líneas en blanco al inicio
      .trim();
  }

  /**
   * Valida si el código consolidado es ejecutable
   */
  validateDartCode(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar que existe main()
    if (!code.includes('void main')) {
      errors.push('No se encontró la función main()');
    }

    // Verificar que no hay imports sin resolver
    const importLines = code.match(/^import\s+['"]([^'"]+)['"]/gm) || [];
    for (const importLine of importLines) {
      if (!importLine.includes('package:') && !importLine.includes('dart:')) {
        errors.push(`Import no resuelto: ${importLine}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
