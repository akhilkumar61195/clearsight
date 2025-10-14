import { Injectable, signal, WritableSignal } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { HubConnectionState } from '@microsoft/signalr';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ChatMessage, UserDetail, ChatAttachment, ChatRoom, GroupType, ChatUser, ContactedUser } from '../../../common/model/chat.types';
import { FileAttachmentService } from '../../../services/file-attachment.service';
import { LookupsService } from '../../../services/lookups.service';
import { S3BucketService } from '../../../services/document-service/s3-bucket.service';
import { DocumentStoreType } from '../../../common/enum/document-store-type.enum';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { DocumentService } from '../../../services/document-service/document.service';

/**
 * Chat Builder Service
 * Manages state for Chat component using Angular signals
 * 
 * Features:
 * - Reactive state management with signals
 * - Chat connection and room management
 * - Message handling and user management
 * - Loading state management
 * - Error handling with user feedback
 */
@Injectable({
    providedIn: 'root'
})
export class ChatBuilderService {    // Chat state signals - directly reference chat service signals
    messages: WritableSignal<ChatMessage[]>;
    connectedUsers: WritableSignal<string[]>;
    connectionState: WritableSignal<HubConnectionState>;
    isJoined = signal<boolean>(false);
    isConnecting = signal<boolean>(false);
    unreadCount = signal<number>(0);

    // User and room state
    userId = signal<number>(0);
    userName = signal<string>('');
    //roomId = signal<number>(2);
    roomName = signal<string>('THOR');
    inputMessage = signal<string>('');
    userDetail = signal<UserDetail | null>(null);

    // Attachment state
    selectedFiles = signal<FileList | null>(null);
    attachments = signal<ChatAttachment[]>([]);
    isUploadingFiles = signal<boolean>(false);
    searchResults = signal<any[]>([]);
    contactList = signal<ContactedUser[]>([]);
    userGroups = signal<ChatRoom[]>([]);
    documentType: number = 0;
    groupMembers = signal<number[]>([]);
    aiUser = signal<ChatUser | null>(null);
    aiTyping = signal<boolean>(false);
    constructor(
        private chatService: ChatService,
        private authService: AuthService,
        private spinner: NgxSpinnerService,
        private messageService: MessageService,
        private s3BucketService: S3BucketService,
        private fileAttachmentService: FileAttachmentService,
        private lookupsService: LookupsService,
        private documentService: DocumentService
    ) {
        this.initializeChat();
    }
    /**
     * Initialize chat with user details and connection state
     */
    private initializeChat(): void {
        const userDetail = this.authService.getUserDetail();
        this.userDetail.set(userDetail);
        this.userId.set(userDetail?.uid || 0);
        this.userName.set(userDetail?.fullName?.toString().trim() || 'Guest');
        // this.lookupsService.getApplications().subscribe(applications => {
        //     this.roomName.set(applications.find(app => app.id === this.roomId())?.applicationName || 'Unknown');
        // });

        // Use the chat service signals directly instead of copying them
        this.messages = this.chatService.messages;
        this.connectedUsers = this.chatService.connectedUsers;
        this.connectionState = this.chatService.connectionState;
        this.isJoined = this.chatService.isJoined;
        this.lookupsService.getDocumentTypes('chat').subscribe(documentTypes => {
            this.documentType = documentTypes[0].id;
        });
        this.getUserByUserName('ai@chevron.com');   //get the AI user
    }

    /**
     * Join a chat room with connection management
     * @param roomId - ID of the room to join
     * @param roomName - Name of the room to join
     * @param groupType - Type of the group (e.g., Module Group)
     */
    async joinRoom(roomId?: number, groupType?: string, roomName?: string): Promise<void> {
        // if (roomName) {
        //     this.roomName.set(roomName);
        // }

        this.unreadCount.set(0);
        this.isConnecting.set(true);

        try {
            // Check if the connection is already established and start it if not
            if (this.connectionState() !== HubConnectionState.Connected) {
                await this.chatService.startConnection();

                // Give a small delay to ensure connection state is updated
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Join the chat room
            await this.chatService.joinRoom(this.userId(), roomId, groupType, roomName); // RoomName replaced by roomId
            //this.isJoined.set(true);

            // this.messageService.add({
            //     severity: 'success',
            //     summary: 'Success',
            //     detail: `Joined room: ${this.roomName()}`
            // });

            //await this.sendMessage(`${this.user()} has joined the room.`);

        } catch (error) {
            console.error('Failed to join room:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to join room: ${this.roomName()}`
            });
        } finally {
            // Ensure isConnecting is set to false after the operation
            this.isConnecting.set(false);
        }
    }

    /**
     * Fetches the chat groups for a specific user.
     * @param userId The ID of the user whose groups are to be fetched.
     */
    async getUserGroups(userId: number): Promise<void> {
        this.chatService.getUserGroups(userId, this.roomName())
            .subscribe({
                next: (groups: ChatRoom[]) => {
                    // const moduleGroup: ChatRoom = {
                    //     name: this.roomName(),
                    //     groupType: GroupType.ModuleGroup
                    // };
                    // const allgroups = [moduleGroup, ...groups];
                    // this.userGroups.set(allgroups);
                    this.userGroups.set(groups);
                },
                error: (error: any) => {
                    console.error('Failed to fetch user groups:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not fetch user groups. Please try again.'
                    });
                }
            });
    }

    /**
     * Sends a message to the chat room.
     * @param selectedUserId - ID of the user to send the message to
     * @param isAIChat - Flag indicating if the chat is with an AI
     * @param roomId - ID of the room to send the message in
     * @returns 
     */
    async sendMessage(selectedUserId?: number, isAIChat?: boolean, roomId?: number): Promise<void> {
        const messageToSend = this.inputMessage();
        const attachmentsToSend = this.attachments();

        if (!messageToSend.trim() && attachmentsToSend.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter a message or select files to send'
            });
            return;
        }

        this.spinner.show('chat-spinner');

        try {
            if (attachmentsToSend.length > 0) {
                for (const [index, attachment] of attachmentsToSend.entries()) {
                    const file = (attachment as any).file as File;
                    if (file) {
                        // const uploadResult = await this.chatService.uploadAttachment(file);                        
                        // const name = uploadResult.name;
                        // const url = uploadResult.url;
                        const folderName = DocumentStoreType.SharedFiles;
                        const type = file.type;
                        // Generate a unique file name to avoid conflicts. Also move extension to the end removing from in between
                        const fileName = `${file.name.substring(0, file.name.lastIndexOf('.'))}_${Date.now()}.${file.name.split('.').pop()}`;
                        const key = `${folderName}/${fileName}`;

                        this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: true, contentType: type }).subscribe({
                            next: (s3Url: any) => {
                                this.s3BucketService.uploadFile(s3Url.url, file).subscribe({
                                    next: (uploadResp: any) => {
                                        this.messageService.add({ severity: 'success', detail: "Upload files successfully!" });
                                        const uploadFileData: DocumentInfo = {
                                            userIdCreatedBy: this.userId(),
                                            userIdLastModifiedBy: this.userId(),
                                            documentTypeId: this.documentType,
                                            entityId: null,
                                            shortDescription: key,
                                            contentType: type,
                                            functionId: null,
                                            appId: null,
                                            folderName: folderName,

                                        };
                                        this.documentService.SaveDocumentInfo(uploadFileData).subscribe({
                                            next: (resp: DocumentInfo) => {
                                                if (messageToSend.trim() && index === 0) {
                                                    this.chatService.sendMessageWithAttachments(messageToSend, key, resp.id, selectedUserId, roomId); // RoomName replaced by roomId
                                                } else {
                                                    this.chatService.sendAttachment(key, resp.id, selectedUserId, roomId); // RoomName replaced by roomId
                                                }
                                            },
                                            error: (err: any) => {
                                                this.spinner.hide();
                                                console.error('Error saving document info', err);
                                            }
                                        });

                                    },
                                    error: (error: any) => {
                                        this.spinner.hide();
                                        let msg = (error?.title ?? error.msg ?? error.message ?? "Failed to upload!");
                                        this.messageService.add({ severity: 'error', summary: 'Failed', detail: msg });

                                    }
                                })
                            },
                            error: (error: any) => {
                                this.spinner.hide();
                                this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL!" });
                                return;
                            }
                        });


                    }
                }
            } else {
                await this.chatService.sendMessage(messageToSend, selectedUserId | 0, roomId); // RoomName replaced by roomId
            }
            if (isAIChat && messageToSend.trim()) {
                // ✅ Show placeholder
                this.aiTyping.set(true);
                this.messages.update(curr => [
                    ...curr,
                    {
                        user: 'AI Chat',
                        message: 'typing-placeholder',
                        messageTime: new Date().toISOString(),
                        isSystem: true
                    }
                ]);
                 // RoomName replaced by roomId
                this.chatService.getAIResponse(messageToSend, this.userId(), roomId).subscribe({
                    next: (response: any) => {
                        // Remove placeholder
                        this.messages.update(curr => curr.filter(m => m.message !== 'typing-placeholder'));
                        this.aiTyping.set(false);
                        // Add real messages
                        const messagesList = response.map(msg => {
                            const isoString = msg.messageTime.replace(" ", "T") + "Z";
                            const localTime = new Date(isoString);

                            return {
                                user: msg.user,
                                message: msg.message,
                                messageTime: localTime.toLocaleString(),
                                attachments: msg.attachments || [],
                                hasAttachments: msg.hasAttachments || false
                            };
                        });

                        this.messages.set(messagesList);
                        this.chatService.messagesList = [...this.chatService.messagesList, ...messagesList];
                    },
                    error: (error: any) => {
                        console.error('Error fetching AI response:', error);
                        this.messages.update(curr => curr.filter(m => m.message !== 'typing-placeholder'));
                        this.aiTyping.set(false);
                    }
                });
            }

            // ✅ Clear input and attachments only
            this.inputMessage.set('');
            this.attachments.set([]);
            this.selectedFiles.set(null);
        } catch (error) {
            console.error('Failed to send message:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to send message. Please try again.'
            });
        } finally {
            this.spinner.hide('chat-spinner');
        }
    }


    /**
     * Handle file selection for attachments
     * @param files - Selected files
     */
    onFilesSelected(files: FileList | null): void {
        if (!files || files.length === 0) {
            return;
        }

        const newAttachments: ChatAttachment[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file using the utility service
            const validation = this.fileAttachmentService.validateFile(file);
            if (!validation.isValid) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Invalid File',
                    detail: `${file.name}: ${validation.error}`
                });
                continue;
            }

            // Create attachment using the utility service
            const attachment = this.fileAttachmentService.createAttachmentFromFile(file);
            newAttachments.push(attachment);
        }

        // Add to existing attachments
        this.attachments.update(current => [...current, ...newAttachments]);
        this.selectedFiles.set(files);
    }

    /**
     * Remove an attachment
     * @param attachmentId - ID of attachment to remove
     */
    removeAttachment(attachmentId: string): void {
        this.attachments.update(current =>
            current.filter(att => att.id !== attachmentId)
        );
    }    /**
     * Download an attachment
     * @param attachment - ChatAttachment object to download
     */
    async downloadAttachment(attachment: DocumentInfo): Promise<void> {
        // try {
        //     this.chatService.downloadAttachment(attachment);
        // } catch (error) {
        //     console.error('Failed to download attachment:', error);
        //     this.messageService.add({
        //         severity: 'error',
        //         summary: 'Download Failed',
        //         detail: 'Could not download the attachment'
        //     });
        // }
        const key = `${attachment.shortDescription}`;
        this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: false, contentType: attachment.contentType }).subscribe({
            next: (s3Url: any) => {
                if (!s3Url || !s3Url.url) {
                    this.spinner.hide();
                    this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL!" });
                    return;
                }
                this.s3BucketService.downloadFile(s3Url.url).subscribe({
                    next: (downloadResp: Blob) => {

                        const url = window.URL.createObjectURL(downloadResp);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = key.split('/').pop();
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                        window.URL.revokeObjectURL(url); // Clean up

                    }

                });

            },
            error: () => {
                this.spinner.hide();
                this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL!" });
            }
        });
    }

    /**
     * Leave the current chat room and cleanup
     */
    async leaveChat(): Promise<void> {
        try {
            await this.chatService.leaveChat();
            this.isJoined.set(false);

            // this.messageService.add({
            //     severity: 'success',
            //     summary: 'Success',
            //     detail: `Left room: ${this.roomName()}`
            // });

        } catch (error) {
            console.error('Failed to leave chat:', error);
            // this.messageService.add({
            //     severity: 'error',
            //     summary: 'Error',
            //     detail: `Failed to leave room: ${this.roomName()}`
            // });
        }
    }

    /**
     * Initialize connection if not already connected
     */
    async initializeConnection(): Promise<void> {
        if (this.connectionState() !== HubConnectionState.Connected) {
            this.isConnecting.set(true);

            try {
                await this.chatService.startConnection();

            } catch (error) {
                console.error('Failed to initialize chat connection:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Connection Error',
                    detail: 'Failed to connect to chat server'
                });
            } finally {
                this.isConnecting.set(false);
            }
        }
    }

    /**
     * Set the input message
     * @param message - Message to set
     */
    setInputMessage(message: string): void {
        this.inputMessage.set(message);
    }

    /**
     * Set the room name
     * @param roomId - Room ID to set
     */
    // setRoomId(roomId: number): void {
    //     this.roomId.set(roomId);
    // }

    /**
     * Set the room name
     * @param roomName - Room name to set
     */
    setRoomName(roomName: string): void {
        this.roomName.set(roomName);
    }

    /**
     * Increment unread count
     */
    incrementUnreadCount(): void {
        this.unreadCount.update(count => count + 1);
    }

    /**
     * Reset unread count
     */
    resetUnreadCount(): void {
        this.unreadCount.set(0);
    }

    /**
     * Get current chat state summary
     */
    getChatState() {
        return {
            isConnected: this.connectionState() === HubConnectionState.Connected,
            isJoined: this.isJoined(),
            isConnecting: this.isConnecting(),
            messageCount: this.messages().length,
            userCount: this.connectedUsers().length,
            unreadCount: this.unreadCount(),
            roomName: this.roomName(),
            userId: this.userId(),
            //roomId: this.roomId()
        };
    }

    /**
     * Join a one-to-one chat room with a specific user
     * @param activeRoom - Room information to join
     */
    async joinOneToOneRoom(activeRoom: ChatRoom): Promise<void> {
        this.unreadCount.set(0);
        this.isConnecting.set(true);

        try {
            // Ensure connection is established
            if (this.connectionState() !== HubConnectionState.Connected) {
                await this.chatService.startConnection();
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await this.chatService.joinOneToOneRoom(activeRoom);

            // Optional: Store current chat receiver or room
            //this.roomName.set(`User_${receiverId}`);
            this.isJoined.set(true);

            // Optional success toast
            // this.messageService.add({
            //   severity: 'success',
            //   summary: 'Connected',
            //   detail: `Started 1:1 chat with user ID: ${receiverId}`
            // });

        } catch (error) {
            console.error('Failed to join one-to-one room:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Connection Error',
                detail: `Could not connect to user ID: ${activeRoom.recipientId}`
            });
        } finally {
            this.isConnecting.set(false);
        }
    }

    /**
     * Searches messages and attachments in the chat.
     */
    async searchMessagesAndAttachments(query: string): Promise<void> {
        this.chatService.searchMessagesAndAttachments(query, this.userId())
            .subscribe((results: any[]) => {
                this.searchResults.set(results);
            });
    }

    /**
     * Gets all contacted users for the current user.
     */
    async getAllContactedUsers(): Promise<void> {
        this.chatService.getAllContactedUsers(this.userId())
            .subscribe((contactedUsers: ContactedUser[]) => {
                this.contactList.set(contactedUsers);
            });
    }

    /**
     * Adds a user to the contact list.
     * @param userId - User ID to add to contact list
     */
    addToContactList(userId: number): void {
        const current = this.contactList();
        if (!current.find(c => c.userId === userId)) {
            const newUser: ContactedUser = { userId, roomId: 0, groupType: GroupType.OneToOne };
            this.contactList.set([...current, newUser]);
        }
    }
    /**
     * Adds users to a chat group.
     * @param roomId - ID of the chat room
     * @param groupType - Type of the group (e.g., Module Group)
     * @param userids - Array of user IDs to add
     */
    async addUsersToGroup(roomId?: number, groupType?: string, userids?: number[], roomName?: string): Promise<void> {
        this.chatService.addUsersToGroup(this.userId(), roomId, groupType, userids, roomName);
    }

    /**
     * @param groupId - The ID of the group to fetch users for.
     * Fetches users by group ID and updates the groupMembers signal.
     */
    async getUsersByGroupId(groupId: number): Promise<void> {
        this.chatService.getUsersByGroupId(groupId)
            .subscribe((userIds: number[]) => {
                this.groupMembers.set(userIds);
            });
    }

    /**
     * Gets a user by their username.
     * @param userName - The username of the user to retrieve.
     */
    async getUserByUserName(userName: string): Promise<void> {
        this.chatService.getUserByUserName(userName)
            .subscribe((user: ChatUser) => {
                this.aiUser.set(user);
            });
    }

    /**
     * Deletes a group.
     * @param roomId - ID of the group to delete
     */
    async deleteGroup(roomId: number): Promise<void> {
        this.chatService.deleteGroup(roomId)
            .subscribe({
                next: () => {
                    // Handle successful deletion
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Group Deleted',
                        detail: `Successfully deleted group`
                    });
                    this.userGroups.update(groups => groups.filter(g => g.id !== roomId));
                },
                error: (error) => {
                    // Handle error
                    console.error('Error deleting group:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Deletion Error',
                        detail: `Could not delete group`
                    });
                }
            });
    }

    /**
     * Removes users from a chat group.
     * @param roomId - ID of the chat room
     * @param userIds - Array of user IDs to remove
     */
    async removeUsersFromGroup(roomId: number, userIds: number[]): Promise<void> {
        this.chatService.removeUsersFromGroup(roomId, userIds)
            .subscribe({
                next: () => {
                    // Handle successful removal
                    this.messageService.add({
                        severity: 'success',
                        summary: 'User Removed',
                        detail: `Successfully removed user ID: ${userIds} from group`
                    });
                },
                error: (error) => {
                    // Handle error
                    console.error('Error removing user from group:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Removal Error',
                        detail: `Could not remove user ID: ${userIds} from group`
                    });
                }
            });
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.leaveChat();
    }
}
