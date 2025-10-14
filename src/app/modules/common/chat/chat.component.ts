import { Component, ElementRef, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ViewChildren, QueryList, WritableSignal, effect, AfterViewInit, NgZone, Signal } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { HubConnectionState } from '@microsoft/signalr';
import { ChatBuilderService } from '../builders/chat-builder.service';
import { ChatMessage, UserDetail, ChatAttachment, ChatRoom, GroupType, ChatUser, ContactedUser, ChatSearchResult } from '../../../common/model/chat.types';
import { FileAttachmentService } from '../../../services/file-attachment.service';
import { UserInfo } from '../../../common/model/UserInfo';
import { UserService } from '../../../services/user.service';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { MarkdownModule } from 'ngx-markdown';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [...PRIME_IMPORTS, MarkdownModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})


export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  message = '';
  userId: number = 0;
  userName: string = '';
  inputMessage = "";
  messages: WritableSignal<ChatMessage[]> = this.chatBuilderService.messages;
  connectedUsers: WritableSignal<string[]> = this.chatBuilderService.connectedUsers;
  userDetail: UserDetail | null = null;
  @Input() roomName = 'THOR';
  isJoined: WritableSignal<boolean> = this.chatBuilderService.isJoined;
  unreadCount: WritableSignal<number> = this.chatBuilderService.unreadCount;
  @Input() isChatEnabled = true; // Input to control chat visibility
  @Output() closeChat$ = new EventEmitter<void>();
  connectionState: WritableSignal<HubConnectionState> = this.chatBuilderService.connectionState;
  isConnecting: WritableSignal<boolean> = this.chatBuilderService.isConnecting;
  // Attachment-related properties
  attachments: WritableSignal<ChatAttachment[]> = this.chatBuilderService.attachments;
  isUploadingFiles: WritableSignal<boolean> = this.chatBuilderService.isUploadingFiles;
  launcherExpanded = false;
  showMenu = false;
  isChatOpen = false;
  selectedUserId: number | null = null;
  chatTitle = 'THOR';
  allUsers: ContactedUser[] = []; // List of all users
  availableUsers: ContactedUser[] = []; // List of available users for chat
  contactedUsers: ContactedUser[] = [];
  groupList: WritableSignal<ChatRoom[]> = this.chatBuilderService.userGroups;
  sidebarOpen = true; // initially open
  compactMode = false;
  isInternalUser: boolean = false;
  isAIChat: boolean = false;
  newGroupName = '';
  showGroupInput = false;
  aiUser: Signal<ChatUser> = this.chatBuilderService.aiUser;
  activeRoom: ChatRoom;
  @ViewChild('scrollMe') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;
  showGroups: boolean = true;
  showUsers: boolean = true;
  searchQuery: string = '';
  filteredGroups: ChatRoom[] = [];
  filteredUsers: ContactedUser[] = [];
  searchResults: WritableSignal<any[]> = this.chatBuilderService.searchResults;
  showSearchResults: boolean = false;
  shouldScrollToBottom = true;
  private previousMessagesLength = 0;
  showAddMembersModal = false;
  selectedUsers: Set<number> = new Set();
  groupMembers: WritableSignal<number[]> = this.chatBuilderService.groupMembers;
  showViewMembersModal = false;
  groupMemberDetails: ContactedUser[] = [];
  eligibleUsers: ContactedUser[] = [];
  addMembersSearchQuery: string = '';
  showDeleteGroupModal = false;
  showExitGroupModal = false;
  showRemoveMemberModal = false;
  selectedMember: ContactedUser | null = null;
  @ViewChildren('groupInput') groupInputs!: QueryList<ElementRef<HTMLInputElement>>;
  constructor(private chatBuilderService: ChatBuilderService,
    private messageService: MessageService, private authService: AuthService,
    private fileAttachmentService: FileAttachmentService, private getUsersService: UserService, private zone: NgZone) { }

  /**
   * Lifecycle hook that is called after the component's view has been fully initialized.
   */
  ngAfterViewInit() {
    // Fires whenever *ngIf creates/destroys the input
    this.groupInputs.changes.subscribe((list: QueryList<ElementRef<HTMLInputElement>>) => {
      const input = list.first?.nativeElement;
      if (!input) return;

      this.zone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          input.focus();
          // optional: input.select();
        });
      });
    });
  }

  /**
   * Initializes the chat component, retrieves user details, and sets up the chat connection.
   * @method ngOnInit
   * @returns {void}
   */
  ngOnInit(): void {
    this.userDetail = this.authService.getUserDetail();
    this.chatBuilderService.getAllContactedUsers().then(() => {
      this.loadUsersList();
    });
    this.userId = parseInt(this.userDetail.uid.toString(), 0);
    this.userName = this.userDetail.fullName?.toString().trim() || 'Guest';
    this.chatTitle = this.roomName + ' Group Chat';
    this.chatBuilderService.setRoomName(this.roomName);
    this.getUserGroups();
    this.filteredGroups = this.groupList();
    this.chatBuilderService.getAllContactedUsers().then(() => {
      this.chatBuilderService.contactList();
    });
  }

  // load users List
  loadUsersList() {
    this.getUsersService.getUsersList().subscribe({
      next: (users: UserInfo[]) => {
        if (Array.isArray(users)) {
          const user = users.find(x => x.id === this.userId);
          this.isInternalUser = user?.isInternalUser;
          this.availableUsers = users
            .filter((user) => user.id !== this.userId)
            .map((user) => ({
              userId: user.id,
              name: user.firstName + ' ' + user.lastName,
            }));
          this.allUsers = users
            .filter((user) => user)
            .map((user) => ({
              userId: user.id,
              name: user.firstName + ' ' + user.lastName,
            }));
          const contactedIds = this.chatBuilderService.contactList().map(c => c.userId);
          
          // this.contactedUsers = this.availableUsers.filter(user => contactedIds.includes(user.userId));

          // // Add roomId and groupType to contactedUsers
          // this.contactedUsers = this.contactedUsers.map(user => {
          //   const contactInfo = this.chatBuilderService.contactList().find(c => c.userId === user.userId);
          //   return {
          //     ...user,
          //     roomId: contactInfo ? contactInfo.roomId : undefined,
          //     groupType: contactInfo ? contactInfo.groupType : undefined
          //   };
          // });

          // Add roomId and groupType to contactedUsers
          this.availableUsers = this.availableUsers.map(user => {
            const contactInfo = this.chatBuilderService.contactList().find(c => c.userId === user.userId);
            return {
              ...user,
              roomId: contactInfo ? contactInfo.roomId : undefined,
              groupType: contactInfo ? contactInfo.groupType : undefined
            };
          });

          this.contactedUsers = this.availableUsers.filter(user => contactedIds.includes(user.userId));

        }
      },
      error: (err) => {
        console.error('Failed to load user list', err);
      }
    });
  }

  /**
   * Fetches the user groups for the current user.
   * @returns {void}
   */
  getUserGroups(): void {
    if (!this.userId) {
      console.warn('No userId set, cannot fetch groups');
      return;
    }

    this.chatBuilderService.getUserGroups(this.userId);
  }

  /**
   * Checks if a message has valid attachments.
   * @param msg - The message object to check.
   * @returns {boolean} - True if the message has valid attachments, false otherwise.
   */
  hasValidAttachments(msg: any): boolean {
    return Array.isArray(msg.attachments) && msg.attachments.some(att => att?.url && att?.shortDescription);
  }

  /**
   * Toggles the visibility of the sidebar.
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.compactMode = !this.compactMode;
  }

  // toggle groups and Users
  toggleGroups() {
    this.showGroups = !this.showGroups;
  }

  /**
   * Toggles the visibility of the user list.
   */
  toggleUsers() {
    this.showUsers = !this.showUsers;
  }

  /**
   * Automatically scrolls to the bottom of the chat container after view updates.
   * @method ngAfterViewChecked
   * @returns {void}
   */
  ngAfterViewChecked(): void {
    if (this.scrollContainer && this.shouldScrollToBottom) {
      const currentLength = this.messages().length;
      if (currentLength > this.previousMessagesLength) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        this.previousMessagesLength = currentLength;
      }
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Hides the chat visibility
   * @method hideChat
   * @returns {void}
   */
  hideChat() {
    this.closeChat$.emit(); // Emit event to notify parent component
  }
  /**
   * Joins a chat room and sends a welcome message.
   * @method joinRoom
   * @returns {void}
   */



  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  openAIChat() {
    this.showMenu = false;
    this.isChatOpen = true;
  }

  // joinChatFromGroup() {
  //   this.launcherExpanded = false;
  //   this.isChatOpen = true;
  //   this.joinRoom();

  // }

  /**
   * Joins a one-to-one chat with the selected user.
   * @param selectedUser - The user to chat with
   */
  joinOneToOneChat(selectedUser: ContactedUser) {
    if (selectedUser?.userId) {
      this.activeRoom = { id: selectedUser.roomId || 0, name: selectedUser.name, groupType: selectedUser.groupType, senderId: this.userId, recipientId: selectedUser.userId };
      this.selectedUserId = selectedUser.userId;
      this.launcherExpanded = false;
      this.isChatOpen = true;
      this.chatTitle = selectedUser.name || 'User';
      this.isAIChat = false;
      this.chatBuilderService.joinOneToOneRoom(this.activeRoom).then(() => {
        this.shouldScrollToBottom = true;
        this.previousMessagesLength = 0; // Reset so it will scroll on initial load
      });
    }
  }

  openHelpDocs() {
    // your redirection logic here
    window.open('/help-docs', '_blank');
  }

  openEmailSupport() {
    window.open('mailto:support@example.com');
  }

  closeChat() {
    this.isChatOpen = false;
    this.showMenu = false;
  }

  /**
 * Sends a message to the chat room.
 */

  sendMessage() {
    this.chatBuilderService.setInputMessage(this.inputMessage);
    this.chatBuilderService.sendMessage(this.selectedUserId, this.isAIChat, this.activeRoom.id).then(() => {
      this.inputMessage = '';
      this.shouldScrollToBottom = true;
      this.previousMessagesLength = 0; // Reset so it will scroll on initial load
    });
    this.chatBuilderService.addToContactList(this.selectedUserId);
    this.loadUsersList();
  }

  /**
   * Handle file selection for attachments
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    this.chatBuilderService.onFilesSelected(files);
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Remove an attachment
   */
  removeAttachment(attachmentId: string): void {
    this.chatBuilderService.removeAttachment(attachmentId);
  }
  /**
   * Download an attachment
   */
  downloadAttachment(attachment: DocumentInfo): void {
    this.chatBuilderService.downloadAttachment(attachment);
  }
  /**
   * Get file size in human readable format
   */
  getFileSize(bytes: number): string {
    return this.fileAttachmentService.formatFileSize(bytes);
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    return this.fileAttachmentService.getFileIconClass(fileType);
  }

  getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  /**
   * Leaves the current chat room and resets the chat state.
   * @method leaveChat
   * @returns {void}
   */
  leaveChat() {
    this.chatBuilderService.leaveChat().then(() => {
      this.closeChat$.emit(); // Emit event to notify parent component
    }).catch(() => {
      this.closeChat$.emit(); // Emit event to notify parent component
    });
  }
  //   openCreateGroupDialog() {
  //   this.newGroupName = '';
  //   this.showCreateGroupDialog = true;
  // }

  // closeCreateGroupDialog() {
  //   this.showCreateGroupDialog = false;
  // }
  cancelGroupInput() {
    this.newGroupName = '';
    this.showGroupInput = false;
  }

  /**
   * Creates a new Private group chat with the specified name.
   * @method createGroup
   * @returns {void}
   */
  createGroup() {
    const groupName = this.newGroupName.trim();
    if (groupName) {
      const group: ChatRoom = {
        id: 0,
        name: groupName,
        groupType: GroupType.PrivateGroup,
        userIdCreatedBy: this.userId
      };
      this.joinGroupChat(group);
    }
    this.newGroupName = '';
    this.showGroupInput = false;
  }

  /**
   * Joins a group chat.
   * @param group The group chat to join.
   */
  joinGroupChat(group: ChatRoom) {
    this.selectedUserId = 0; // Reset selected user ID for group chat
    this.activeRoom = group;
    // console.log('Opening chat:', group);
    this.chatTitle = group.name;
    this.isChatOpen = true;
    this.isAIChat = false;
    this.chatBuilderService.joinRoom(group.id, group.groupType, group.name).then(() => {
      this.shouldScrollToBottom = true;
      this.previousMessagesLength = 0; // Reset so it will scroll on initial load
      if (group.groupType === 'Private Group') {
        this.getUserGroups();
        setTimeout(() => {
          this.activeRoom = this.groupList().find(g => g.name === this.activeRoom.name);
        }, 2000);
      }
      if (group.id != 0) {
        this.chatBuilderService.getUsersByGroupId(group.id);
      }
    });
  }

  /**
   * For AI Chat
   */
  joinAIChat() {
    const aiChatRoomId = this.chatBuilderService.contactList().find(c => c.groupType == GroupType.AIChat)?.roomId;
    this.activeRoom = { id: aiChatRoomId || 0, name: 'AI Chat', groupType: GroupType.AIChat, senderId: this.userId, recipientId: this.aiUser().userId };
    this.chatTitle = 'AI Chat';
    this.isChatOpen = true;
    this.isAIChat = true;
    this.chatBuilderService.joinOneToOneRoom(this.activeRoom).then(() => {
      this.shouldScrollToBottom = true;
      this.previousMessagesLength = 0; // Reset so it will scroll on initial load
    });
  }

  /**
   * Handles changes to the search input. This method does the live filtering of the chat list.
   * @method onSearchChange
   * @returns {void}
   */
  onSearchChange() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.showSearchResults = false;
      return;
    }
    this.chatBuilderService.searchMessagesAndAttachments(query);
    this.filteredGroups = this.groupList().filter((g) => g.name.toLowerCase().includes(query));
    this.filteredUsers = this.availableUsers.filter((u) =>
      u.name.toLowerCase().includes(query)
    );
    this.showSearchResults = this.filteredGroups.length > 0 || this.filteredUsers.length > 0 || this.searchResults().length > 0;
  }
  /**
   * Selects a search result from the filtered list and takes to the corresponding chat when clicked.
   * @method selectSearchResult
   * @return {void}
   */
  selectSearchResult(result: ChatSearchResult, type: 'group' | 'user' | 'message') {
    if(result.groupType == GroupType.AIChat){
      this.joinAIChat();
    }
    else if(result.groupType == GroupType.PrivateGroup || result.groupType == GroupType.ModuleGroup){
      const group: ChatRoom = { id: result.roomId, name: result.roomName, groupType: result.groupType };
      this.joinGroupChat(group);
    } 
    else if(result.groupType == GroupType.OneToOne){
      const [userAId, userBId] = result.roomName.split('_');
      const receiverId = parseInt(userAId) == this.userId ? parseInt(userBId) : parseInt(userAId);
      result.groupType = GroupType.OneToOne;
      const selectedUser: ContactedUser = { userId: receiverId, name: this.getReceiverName(result.roomName), roomId: result.roomId, groupType: result.groupType };
      this.joinOneToOneChat(selectedUser);
    }
    
    this.searchQuery = '';
    this.showSearchResults = false;
    this.searchResults.set([]); // Clear search results after selection
  }
  get filteredEligibleUsers() {
    if (!this.addMembersSearchQuery.trim()) {
      return this.eligibleUsers;
    }
    const query = this.addMembersSearchQuery.toLowerCase();
    return this.eligibleUsers.filter(u => u.name.toLowerCase().includes(query));
  }

  /**
   * Selects a user from the search results.
   * @param result - selected user from search result
   */
  selectUserSearchResult(result){
    const selectedUser: ContactedUser = { userId: result.userId, name: result.name, groupType: result.groupType || GroupType.OneToOne, roomId: result.roomId };
    this.joinOneToOneChat(selectedUser);
    this.searchQuery = '';
    this.showSearchResults = false;
    this.searchResults.set([]);
  }

  clearAddMembersSearch() {
    this.addMembersSearchQuery = '';
  }
  /**
   * Gets the name of the receiver in a chat room.
   * @param roomName The name of the chat room.
   * @returns The name of the receiver.
   */
  getReceiverName(roomName: string): string {
    const [userAId, userBId] = roomName.split('_').map(id => parseInt(id, 10));
    const receiverId = userAId === this.userId ? userBId : userAId;

    if (isNaN(receiverId)) return roomName; // group chat
    if (receiverId === 0) return 'AI Chat';

    const receiver = this.availableUsers.find(user => user.userId === receiverId);
    return receiver ? receiver.name : 'Unknown User';
  }

  /**
   * This method returns the initials of a given name.
   * @method getInitials
   * @return {string}
   */
  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getDocumentName(shortDescription: string) {
    return shortDescription.split('/').pop();
  }
  /**
   * Opens the add members modal for a specific group.
   * @param group The group to add members to.
   * @returns {void}
   */
  openAddMembers(group: any) {
    //if (!this.activeRoom?.id) return;

    this.chatBuilderService.getUsersByGroupId(this.activeRoom.id).then(() => {
      const memberIds = this.groupMembers();

      // Only users who are NOT already members
      this.eligibleUsers = this.availableUsers.filter(u => !memberIds.includes(u.userId));

      this.selectedUsers.clear();
      this.showAddMembersModal = true;
    });
  }
  /**
   * Checks if the add members functionality is enabled for the current chat.
   * @returns {boolean} True if adding members is enabled, false otherwise.
   */
  isAddMemberEnabled(): boolean {
    return this.activeRoom.groupType === 'Private Group' && this.activeRoom.userIdCreatedBy === this.userId;
  }
  /**
   * Closes the add members modal.
   * @returns {void}
   */
  closeAddMembers() {
    this.showAddMembersModal = false;
    this.selectedUsers.clear();
  }
  /**
   * Opens the view members modal for a specific group with the eligible users.
   * @returns {void}
   */
  openViewMembers() {
    //if (!this.activeRoom?.id) return;

    this.chatBuilderService.getUsersByGroupId(this.activeRoom.id).then(() => {
      const memberIds = this.groupMembers(); // signal of userIds

      // map IDs to names from availableUsers
      this.groupMemberDetails = memberIds
        .map(id => this.allUsers.find(u => u.userId === id));
        //.filter(u => u) as { userId: number; name: string }[];
      this.showViewMembersModal = true;
    });
  }

  /**
   * Toggles the selection of a user for adding to a group.
   * @param userId The ID of the user to toggle.
   */
  openDeleteGroupModal() {
    this.showDeleteGroupModal = true;
  }

  /**
   * Closes the delete group modal.
   * @returns {void}
   */
  closeDeleteGroupModal() {
    this.showDeleteGroupModal = false;
  }

  /**
   * Deletes the current group.
   * @returns {void}
   */
  deleteGroup() {
    if (!this.activeRoom?.name) return;

    this.chatBuilderService.deleteGroup(this.activeRoom.id);
    this.showDeleteGroupModal = false;
    this.activeRoom = null;
  }

  /**
   * Opens the exit group modal.
   */
  openExitGroupModal() {
    this.showExitGroupModal = true;
  }

  /**
   * Closes the exit group modal.
   * @returns {void}
   */
  closeExitGroupModal() {
    this.showExitGroupModal = false;
  }

  /**
   * Exits the current group chat.
   * @returns {void}
   */
  exitGroup() {
    if (!this.activeRoom?.id) return;

    this.chatBuilderService.removeUsersFromGroup(
      this.activeRoom.id,
      [this.userId]
    )
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Removed',
          detail: `${this.selectedMember.name} has been removed from the group`
        });
        this.selectedMember = null;
        this.showRemoveMemberModal = false;
        this.openViewMembers(); // refresh member list
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove member'
        });
      });
  }

  /**
   * Opens the remove member dialog.
   * @param member The member to be removed.
   */
  openRemoveMemberDialog(member: any) {
    this.selectedMember = member;
    this.showRemoveMemberModal = true;
    this.showViewMembersModal = false;
  }

  /**
   * Closes the remove member dialog.
   */
  closeRemoveMemberDialog() {
    this.selectedMember = null;
    this.showRemoveMemberModal = false;
  }

  /**
   * Confirms the removal of a member from the group.
   * @returns {void}
   */
  confirmRemoveMember() {
    if (!this.activeRoom?.id || !this.selectedMember) return;
     // RoomName replaced by roomId
    this.chatBuilderService.removeUsersFromGroup(
      this.activeRoom.id,
      [this.selectedMember.userId]
    )
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Removed',
          detail: `${this.selectedMember.name} has been removed from the group`
        });
        this.selectedMember = null;
        this.showRemoveMemberModal = false;
        this.openViewMembers(); // refresh member list
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove member'
        });
      });
  }

  /**
   * Closes the view members modal.
   * @returns {void}
   */
  closeViewMembers() {
    this.showViewMembersModal = false;
  }
  /**
   * Adds the selected users to the group
   */
  addSelectedUsers() { // RoomName replaced by roomId
    this.chatBuilderService
      .addUsersToGroup(this.activeRoom.id, this.activeRoom.groupType, Array.from(this.selectedUsers), this.activeRoom.name)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Users successfully added to the group',
        });

        // Refresh members immediately
        this.chatBuilderService.getUsersByGroupId(this.activeRoom.id).then(() => {
          const memberIds = this.groupMembers();

          // Update view members list
          this.groupMemberDetails = memberIds
            .map(id => this.allUsers.find(u => u.userId === id))
            //.filter(u => !!u) as { id: number; name: string }[];

          // Update eligible users list
          this.eligibleUsers = this.availableUsers.filter(u => !memberIds.includes(u.userId));

          this.closeAddMembers(); // Close dialog after refresh
        });
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add users to the group',
        });
      });
  }

  /**
   * Toggles the selection of a user for adding to a group.
   * @param userId The ID of the user to toggle.
   */
  toggleUserSelection(userId: number) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  /**
   * Cleans up the chat service connection when the component is destroyed.
   * @method ngOnDestroy
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.chatBuilderService.destroy();
  }

}
