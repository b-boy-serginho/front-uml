import { inject, Injectable } from "@angular/core";
import { ExportSpringBoot, UMLDiagram } from "../interfaces/uml-models";
import { Diagram } from "../../diagrams/interfaces/diagram.interface";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PizarraService {


   private apiUrl: string = 'http://localhost:3000/api/';
   private httpClient = inject(HttpClient);

    exportSpringBoot(diagram: UMLDiagram, projectName: string, basePackage: string) {
      return this.httpClient.post(this.apiUrl + 'project/export/fullstack', {
          diagram,
          projectName,
          basePackage
       }, { responseType: 'blob' });
   }
  // Service code here
}