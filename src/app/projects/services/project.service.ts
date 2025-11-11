import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../interfaces/project.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private httpClient = inject(HttpClient);
  private apiUrl: string = environment.apiUrl + '/api/project';
  getByUserId(userId: string): Observable<Project[]> {
    return this.httpClient.get<Project[]>(`${this.apiUrl}/user/${userId}`);
  }

  getById(id: string): Observable<Project> {
    console.log('Fetching project by ID:', id);
    return this.httpClient.get<Project>(`${this.apiUrl}/${id}`);
  }
  saveProject(project: Partial<Project>): Observable<Project> {
    project.userId = localStorage.getItem('user_id') || undefined;
    console.log('Saving project in service:', project);
    return this.httpClient.post<Project>(this.apiUrl, project);
  }
  deleteProject(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
  }
}
