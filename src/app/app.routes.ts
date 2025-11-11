import { Routes } from '@angular/router';

import { ProjectListComponent } from './projects/pages/project-list/project-list.component';
import { ProjectFormComponent } from './projects/components/project-form/project-form.component';
import { DiagramListComponent } from './diagrams/pages/diagram-list/diagram-list.component';

import { UMLCanvasComponent } from './pizarra/pages/uml-canvas.component';
import { HomePageComponent } from './share/pages/home-page/home-page.component';
import { LoginComponent } from './auth/pages/login/login.component';
import { RegisterComponent } from './auth/pages/register/register.component';

export const routes: Routes = [
  { path: '',component:HomePageComponent },


  { path: 'login',component:LoginComponent},
  { path: 'register', component: RegisterComponent },
  // Rutas sin sidebar (gestión de proyectos)
  { path: 'projects', component: ProjectListComponent },
  { path: 'projects/new', component: ProjectFormComponent },
  { path: 'projects/edit/:id', component: ProjectFormComponent },
  { path: 'projects/:id/diagrams', component: DiagramListComponent },
 
  {
    path: 'diagrama/canvas/:id',
    component: UMLCanvasComponent
  },
  {
    path: 'diagrama/room/:roomId',
    component: UMLCanvasComponent
  },
  { path: '**', redirectTo: '/projects' }

];
