import { Component, effect, OnDestroy, OnInit, WritableSignal } from '@angular/core';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { listBuilder } from '../../../common/model/configuration-values';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { TaskManagement } from '../../../common/model/taskManagementModel';
import { ListEditorComponentLayoutComponent } from '../../common/list-editor-component-layout/list-editor-component-layout.component';
import { Subscription } from 'rxjs';
import { ChatComponent } from '../../common/chat/chat.component';

@Component({
  selector: 'app-tyr-list-editor',
  templateUrl: './tyr-list-editor.component.html',
  styleUrl: './tyr-list-editor.component.scss',
    standalone: true,
    imports: [ListEditorComponentLayoutComponent, ChatComponent ],
})
export class TyrListEditorComponent implements OnInit, OnDestroy {
  selectedView = 1;
  listEditorData: listBuilder[] = [];
  storeListEditorData: WritableSignal<listBuilder[]> =
    this.builderService.listEditor;
  listEditorSelection = this.builderService.selectedListOption;
  tasksOptionList: TaskManagement[] = [];
  roomName: string = 'TYR';
  // Subscription to manage API call subscriptions and prevent memory leaks
  private tyrListSubscription: Subscription = new Subscription();

  constructor(private builderService: ListEditorBuilderService, private configurationValuesService: ConfigurationValuesService) {
    effect(() => {
      this.listEditorData = this.storeListEditorData();
    });
  }

  // Resetting the signal
  ngOnDestroy(): void {
    this.builderService.selectedFunctionId.set(-1);
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.tyrListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.builderService.selectedFunctionId.set(1); // Setting default selection
    this.getListEditorOptions();
    // Added the default configurations for app and list editor
    this.builderService.getConfiguartions();
    this.listEditorData = this.builderService.listEditor();
  }

    // Get the list of options
    getListEditorOptions() {
      this.tyrListSubscription = this.configurationValuesService.getTaskManagementList().subscribe({
        next: (response) => {
          this.tasksOptionList = response;
        },
        error: (error) => {
          console.error('Error fetching record', error);
        },
      });
    }
}
