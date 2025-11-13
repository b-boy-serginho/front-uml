import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Diagram } from '../interfaces/diagram.interface';

@Injectable({
  providedIn: 'root'
})
export class DiagramService {

  private httpClient = inject(HttpClient);
  private apiUrl: string = environment.apiUrl + '/api/diagram';
  getByUserId(userId: string): Observable<Diagram[]> {
    return this.httpClient.get<Diagram[]>(`${this.apiUrl}/user/${userId}`);
  }

  getByProjectId(id: string): Observable<Diagram[]> {
    console.log('Fetching diagram by Project ID:', id);
    return this.httpClient.get<Diagram[]>(`${this.apiUrl}/project/${id}`);
  }

  getById(id: string): Observable<Diagram> {
    console.log('Fetching diagram by ID:', id);
    return this.httpClient.get<Diagram>(`${this.apiUrl}/${id}`);
  }

  saveDiagram(diagram: Partial<Diagram>): Observable<Diagram> {
    console.log('Saving diagram in service:', diagram);
    return this.httpClient.post<Diagram>(this.apiUrl, diagram);
  }

  updateDiagram(id: string, diagram: Partial<Diagram>): Observable<Diagram> {
    console.log('Updating diagram in service:', id, diagram);
    return this.httpClient.patch<Diagram>(`${this.apiUrl}/${id}`, diagram);
  }
  deleteDiagram(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
  }
}
