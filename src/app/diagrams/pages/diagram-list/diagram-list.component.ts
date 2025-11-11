import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DiagramService } from '../../services/diagram.service';
import { Diagram } from '../../interfaces/diagram.interface';


@Component({
  selector: 'app-diagram-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-list.component.html',
  styleUrls: ['./diagram-list.component.css']
})
export class DiagramListComponent  {

  diagrams: Diagram[] = [];
  projectId: string = '';

  private diagramService = inject(DiagramService)
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute)

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = id;
        this.diagramService.getByProjectId(this.projectId).subscribe(diagrams => {
          console.log('Diagrams fetched for project', this.projectId, diagrams);
          this.diagrams = diagrams;
        });
      }
    });



  }
  loadDiagrams(): void {
    this.diagramService.getByProjectId(this.projectId).subscribe(diagrams => {
      this.diagrams = diagrams;
    });
  }

  createNewDiagram(): void {
    this.router.navigate(['/projects', this.projectId, 'diagrams', 'new']);
  }

  editDiagram(diagramId: string): void {
    this.router.navigate(['/projects', this.projectId, 'diagrams', 'edit', diagramId]);
  }

  openDiagram(diagramId: string): void {
    this.router.navigate(['/diagrama/canvas', diagramId]);
  }

  deleteDiagram(diagram: Diagram): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el diagrama "${diagram.name}"?`)) {
      this.diagramService.deleteDiagram(diagram.id);
      this.loadDiagrams();
    }
  }

  backToProjects(): void {
    this.router.navigate(['/projects']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES');
  }
}
