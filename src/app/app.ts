import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Diagramador UML');

  onSidebarItemSelected(itemId: string): void {
    console.log('Sidebar item selected:', itemId);
    // Aquí puedes manejar las diferentes acciones según el item seleccionado
    switch (itemId) {
      case 'home':
        // Acción para Home
        break;
      case 'dashboard':
        // Acción para Dashboard
        break;
      case 'classes':
        // Acción para Clases UML
        break;
      case 'relations':
        // Acción para Relaciones
        break;
      case 'templates':
        // Acción para Plantillas
        break;
      case 'export':
        // Acción para Exportar
        break;
      case 'settings':
        // Acción para Configuración
        break;
    }
  }
}
