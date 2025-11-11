import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces/project.model';


@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent{
 

  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
    private formbuilder = inject(FormBuilder);

   public myForm: FormGroup = this.formbuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    visibility: ['', [Validators.required]],
  })
  isEditMode = false;
  projectId: string | null = null;

  

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.projectId = id;
         this.projectService.getById(id).subscribe({
          next: (project: Project) => {
            console.log('Fetched project:', project);
            this.myForm.patchValue({
              name: project.name,
              description: project.description,
              visibility: project.visibility
            });
          },
          error: (err) => {
            console.error('Error fetching project:', err);
          }
         });
      } else {
        this.isEditMode = false;
        this.projectId = null;
      }
    });
  }

  onSubmit(): void {

  }


  save(){
    if (this.myForm.invalid) {
      return;
    }
    const projectData: Partial<Project> = {
      name: this.myForm.value.name,
      description: this.myForm.value.description,
      visibility: this.myForm.value.visibility,
    };
    
    if (this.isEditMode && this.projectId) {
      // Lógica para actualizar un proyecto existente
      // this.projectService.updateProject(this.projectId, projectData).subscribe(() => {
      //   this.router.navigate(['/projects']);
      // });
    } else {
      console.log('Saving new project:', projectData);
       this.projectService.saveProject(projectData).subscribe(() => {
         this.router.navigate(['/projects']);
       });
    }
  }


  onCancel(): void {
    this.router.navigate(['/projects']);
  }




}
