import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { UMLClass, UMLDiagram } from '../../interfaces/uml-models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  private chatService = inject(ChatService);

  @Output() diagramRequested = new EventEmitter<UMLDiagram>();

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isAIProcessing: boolean = false;
  showEmojiPicker: boolean = false;
  emojis: string[] = ['😀', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💡', '✅', '❌'];

    selectedFile: File | undefined;
  selectedFileType: 'image' | 'audio' | undefined;
  selectedFilePreview: string | null = null;



  isRecording: boolean = false;
  recordingTime: number = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: any;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Suscribirse a los mensajes del chat
    console.log('vuelve a crearse el chat component'),
    this.subscriptions.push(
      this.chatService.getMessages().subscribe(messages => {
        this.messages = messages;
        console.log('Mensajes recibidos en chat component:', messages);
        setTimeout(() => this.scrollToBottom(), 100);
      })
    ); 
  }

  ngOnDestroy(): void {
     this.subscriptions.forEach(
      sub => sub.unsubscribe());
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || this.isAIProcessing) return;
    const userMessage = this.newMessage.trim();
    this.newMessage = '';
    this.resetTextareaHeight();
    // Agregar mensaje del usuario
    this.chatService.addUserMessage(userMessage);
    // Procesar con IA
    this.isAIProcessing = true;
    try {
      if(this.selectedFileType === 'image'){
         var response = await this.chatService.processUserMessage2(userMessage, 'image', this.selectedFile);
         this.diagramRequested.emit(response!);
      }
       if(this.selectedFileType === 'audio'){
          var response = await this.chatService.processUserMessage2(userMessage, 'audio', this.selectedFile);
          this.diagramRequested.emit(response!);
      }
      if(!this.selectedFileType){
         var response = await this.chatService.processUserMessage2(userMessage);
         this.diagramRequested.emit(response!);
      }
      
    
    }
    catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.chatService.addAssistantMessage(
        'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
      );
    } finally {
      this.isAIProcessing = false;
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  isUserMessage(message: ChatMessage): boolean {
    return message.role === 'user';
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onMessageKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onMessageInput(event: Event): void {
    this.adjustTextareaHeight();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  eliminarMensaje(): void {
    if (this.messages.length === 0) return;
      this.chatService.clearMessages();
  }

  imagen(): void {

  }

  addEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
    this.adjustTextareaHeight();
  }

  private adjustTextareaHeight(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match the content, with a maximum
      const maxHeight = 120; // máximo 120px
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + 'px';
    }
  }

  resetTextareaHeight(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
    }
  }





  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('La imagen es muy grande. Máximo 5MB');
        return;
      }

      this.selectedFile = file;
      this.selectedFileType = 'image';
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedFilePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

 
  async toggleRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  // Iniciar grabación
  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingTime = 0;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
         console.log('Audio Blob creado:', audioBlob);
        //this.sendAudioMessage(audioBlob);
        
        // Detener todas las pistas del stream
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Contador de tiempo
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);

    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  }


  removeSelectedFile(): void {
    if (this.selectedFilePreview) {
      URL.revokeObjectURL(this.selectedFilePreview);
    }
    this.selectedFile = undefined;
    this.selectedFilePreview = null;
  }
  // Detener grabación
  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
      }
    }
  }

  // Cancelar grabación
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      this.recordingTime = 0;
      
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
      }

      // Detener sin guardar
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  }

  // Formatear tiempo de grabación
  formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
