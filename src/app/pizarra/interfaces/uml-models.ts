

export interface ExportSpringBoot {
   diagram: UMLDiagram;
   projectName: string;
  packageName: string;
}

export interface UMLDiagram {
  id: string;
  name: string;
  classes: UMLClass[];
  relations: UMLRelation[];
}


export interface UMLClass {
  id: string;
  name: string;
  attributes: UMLAttribute[];
  methods?: UMLMethod[];
  position: { x: number; y: number };
  isAbstract?: boolean;
  isInterface?: boolean;
  stereotype?: string;
}


export interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected' | 'package';
  isStatic?: boolean;
  isForeignKey?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  columnName?: string;

}


export interface UMLMethod {
  id: string;
  name: string;
  returnType: string;
  parameters: UMLParameter[];
  visibility: 'public' | 'private' | 'protected' | 'package';
  isStatic?: boolean;
  isAbstract?: boolean;
}

export interface UMLParameter {
  name: string;
  type: string;
}
export const VISIBILITY_SYMBOLS = {
  public: '+',
  private: '-',
  protected: '#',
  package: '~'
};



export type RelationType = 
  | 'association' 
  | 'aggregation' 
  | 'composition' 
  | 'inheritance' 
  | 'realization'
  | 'associationClass'   
  | 'dependency';

export interface UMLRelation {
  id: string;
  fromClassId: string;
  toClassId: string;
  type: RelationType;
  label?: string;
  multiplicity?: {
    from?: string;
    to?: string;
  };
  // Para clases de asociación
  associationClassId?: string; // ID de la clase que representa esta asociación
}




