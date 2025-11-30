import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces/project.model';
import { HeaderComponent } from '../../../share/components/header/header.component';


@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];


  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private router = inject(Router);


  ngOnInit(): void {

        const id = localStorage.getItem('user_id') || '';
        if (id) {
        this.projectService.getByUserId(id).subscribe({
          next: (data: Project[]) => {
            this.projects = data
          },
          error: (err) => {
            console.error('Error fetching projects:', err);
          }

        })
       }     
  

  }


  createNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  viewDiagrams(id: string): void {
    this.router.navigate(['/projects', id, 'diagrams']);
   }


  editProject(id: string): void {
    this.router.navigate(['/projects/edit', id]);
  }

  deleteProject(project: Project): void { 
    if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${project.name}"?`)) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
        },
        error: (err) => {
          console.error('Error deleting project:', err);
        }
      });
    }
  }
}
