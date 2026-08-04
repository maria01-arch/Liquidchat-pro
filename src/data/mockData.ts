import { User, Chat, Message, CloudFile, NotificationItem } from '../types';
import { generateFingerprint, encryptE2EEMessage } from '../utils/crypto';

export const CURRENT_USER: User = {
  id: 'usr_me_101',
  username: 'AlexRider',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  passkey: 'liquid-7f9a-alpha-bravo-omega-92x8-titan-crypt-echo-vector-x9',
  status: 'online',
  customStatus: '⚡ Encryption active • liquidchat',
  bio: 'Product Designer @ xchordlabs corp. Building liquidchat.',
  createdAt: '2026-08-01',
  publicKeyFingerprint: generateFingerprint('AlexRider_pub_key_2026')
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'usr_ai_999',
    username: 'xchord AI',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    passkey: 'ai-system-key-xchordlabs-corp',
    status: 'online',
    customStatus: '🤖 Built by xchordlabs corp',
    bio: 'Official liquidchat AI assistant for tasks, advice, chat summaries & tips.',
    createdAt: '2026-08-01',
    publicKeyFingerprint: 'XCHORD-AI-CORP-9999-KEY0'
  },
  {
    id: 'usr_elena_202',
    username: 'ElenaRostova',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    passkey: 'liquid-elena-passkey-vector-key',
    status: 'online',
    customStatus: '🔒 E2EE Fingerprint verified',
    bio: 'Lead Security Architect @ xchordlabs corp.',
    createdAt: '2026-08-02',
    publicKeyFingerprint: generateFingerprint('ElenaRostova_key_2026')
  },
  {
    id: 'usr_marcus_303',
    username: 'MarcusVance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    passkey: 'liquid-marcus-passkey-alpha-key',
    status: 'away',
    customStatus: '⏱️ Self-destruct 30s enabled',
    bio: 'Systems Engineer & Cryptographer.',
    createdAt: '2026-08-03',
    publicKeyFingerprint: generateFingerprint('MarcusVance_key_2026')
  },
  {
    id: 'usr_sophia_404',
    username: 'SophiaLin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    passkey: 'liquid-sophia-passkey-beta-key',
    status: 'offline',
    customStatus: '📁 Liquid Storage vault synced',
    bio: 'UI/UX Lead.',
    createdAt: '2026-08-04',
    publicKeyFingerprint: generateFingerprint('SophiaLin_key_2026')
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_ai_001',
    name: 'xchord AI Assistant',
    type: 'ai',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    lastMessage: 'Hello Alex! I am xchord AI by xchordlabs corp. How can I assist you with tasks or encryption today?',
    lastMessageTime: '03:14 AM',
    isPinned: true,
    selfDestructTimer: 0,
    e2eFingerprint: 'XCHORD-AI-VERIFIED-9999',
    members: [CURRENT_USER, MOCK_USERS[1]],
    topic: 'Official liquidchat Assistant',
    description: 'Ask xchord AI for chat summaries, reply ideas, security audits, code reviews & task planning.'
  },
  {
    id: 'chat_group_002',
    name: 'Liquid Core Devs 🔒',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    unreadCount: 2,
    lastMessage: 'Elena shared liquidchat_architecture_v2.pdf into Liquid Vault!',
    lastMessageTime: '02:45 AM',
    isPinned: true,
    selfDestructTimer: 0,
    e2eFingerprint: generateFingerprint('Liquid_Core_Group_Secret'),
    members: [CURRENT_USER, MOCK_USERS[2], MOCK_USERS[3], MOCK_USERS[4]],
    groupInviteCode: 'LQ-CORE-2026-JOIN',
    topic: 'liquidchat launch preparations & E2EE audit',
    description: 'Official group chat for core architecture & secure file vault sharing.'
  },
  {
    id: 'chat_direct_003',
    name: 'Elena Rostova',
    type: 'direct',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    lastMessage: 'Check out the new passkey recovery protocol diagram.',
    lastMessageTime: 'Yesterday',
    isPinned: false,
    selfDestructTimer: 0,
    e2eFingerprint: generateFingerprint('Alex_Elena_E2EE_Pair'),
    members: [CURRENT_USER, MOCK_USERS[2]],
    topic: 'Security Architecture',
    description: 'Direct E2EE chat with Lead Security Architect.'
  },
  {
    id: 'chat_direct_004',
    name: 'Marcus Vance',
    type: 'direct',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    unreadCount: 1,
    lastMessage: 'Sending a self-destructing audio voice note in 30 seconds.',
    lastMessageTime: 'Aug 02',
    isPinned: false,
    selfDestructTimer: 30, // 30s timer enabled
    e2eFingerprint: generateFingerprint('Alex_Marcus_E2EE_Pair'),
    members: [CURRENT_USER, MOCK_USERS[3]],
    topic: 'Ephemeral Messaging',
    description: 'Direct chat with 30s auto-burn timer.'
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  chat_ai_001: [
    {
      id: 'msg_ai_1',
      chatId: 'chat_ai_001',
      senderId: 'usr_ai_999',
      senderName: 'xchord AI',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      content: 'Welcome to liquidchat! I am xchord AI, your built-in intelligent assistant crafted by xchordlabs corp. You can ask me for task advice, security tips, message drafting, or summarizing long group conversations.',
      type: 'text',
      timestamp: '03:10 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    },
    {
      id: 'msg_ai_2',
      chatId: 'chat_ai_001',
      senderId: 'usr_me_101',
      senderName: 'AlexRider',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content: 'How does passkey account recovery work in liquidchat?',
      type: 'text',
      timestamp: '03:12 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    },
    {
      id: 'msg_ai_3',
      chatId: 'chat_ai_001',
      senderId: 'usr_ai_999',
      senderName: 'xchord AI',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      content: `🔒 **Passkey Security by xchordlabs corp**:
1. When you created your account, liquidchat generated a 12-word cryptographic seed phrase passkey.
2. This passkey derives your private E2EE keys locally.
3. You can log into liquidchat from any new browser or mobile device simply by pasting your recovery passkey!
4. Store your passkey in a safe offline location.`,
      type: 'text',
      timestamp: '03:14 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    }
  ],
  chat_group_002: [
    {
      id: 'msg_grp_1',
      chatId: 'chat_group_002',
      senderId: 'usr_elena_202',
      senderName: 'ElenaRostova',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      content: encryptE2EEMessage('Hey team! Final E2EE security audit for liquidchat completed. AES-256 + WebCrypto fingerprinting looks rock solid.', 'Liquid_Core_Group_Secret'),
      type: 'text',
      timestamp: '02:30 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    },
    {
      id: 'msg_grp_2',
      chatId: 'chat_group_002',
      senderId: 'usr_sophia_404',
      senderName: 'SophiaLin',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Here is the sleek UI layout preview for the Liquid Storage vault:',
      type: 'image',
      attachmentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      attachmentName: 'liquidchat_ui_mockup.png',
      timestamp: '02:35 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    },
    {
      id: 'msg_grp_3',
      chatId: 'chat_group_002',
      senderId: 'usr_marcus_303',
      senderName: 'MarcusVance',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content: 'Quick update voice note regarding self-destruct timers and WebSockets:',
      type: 'voice',
      attachmentUrl: 'synth_voice_1',
      voiceDuration: 14,
      timestamp: '02:40 AM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    },
    {
      id: 'msg_grp_4',
      chatId: 'chat_group_002',
      senderId: 'usr_elena_202',
      senderName: 'ElenaRostova',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      content: 'I uploaded the official architecture specification sheet to our Liquid Storage vault.',
      type: 'file',
      attachmentName: 'liquidchat_architecture_v2.pdf',
      attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      attachmentSize: '2.4 MB',
      timestamp: '02:45 AM',
      isEncrypted: true,
      status: 'delivered',
      selfDestructTimer: 0
    }
  ],
  chat_direct_003: [
    {
      id: 'msg_dir_1',
      chatId: 'chat_direct_003',
      senderId: 'usr_elena_202',
      senderName: 'ElenaRostova',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      content: encryptE2EEMessage('Hi Alex! Remember to verify our E2EE fingerprint hex string when you get a chance.', 'Alex_Elena_E2EE_Pair'),
      type: 'text',
      timestamp: 'Yesterday 09:15 PM',
      isEncrypted: true,
      status: 'read',
      selfDestructTimer: 0
    }
  ],
  chat_direct_004: [
    {
      id: 'msg_dir_2',
      chatId: 'chat_direct_004',
      senderId: 'usr_marcus_303',
      senderName: 'MarcusVance',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content: encryptE2EEMessage('This confidential note has a 30-second self-destruct timer attached. Try setting your timer to 5s in the chat header!', 'Alex_Marcus_E2EE_Pair'),
      type: 'text',
      timestamp: 'Aug 02 11:20 AM',
      isEncrypted: true,
      status: 'delivered',
      selfDestructTimer: 30
    }
  ]
};

export const INITIAL_FILES: CloudFile[] = [
  {
    id: 'file_001',
    ownerId: 'usr_me_101',
    name: 'liquidchat_architecture_v2.pdf',
    size: 2516582,
    sizeFormatted: '2.4 MB',
    mimeType: 'application/pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    category: 'document',
    uploadedAt: '2026-08-04 02:45 AM',
    isFavorite: true,
    sharedChatIds: ['chat_group_002']
  },
  {
    id: 'file_002',
    ownerId: 'usr_me_101',
    name: 'security_keypair_backup.json',
    size: 4096,
    sizeFormatted: '4.0 KB',
    mimeType: 'application/json',
    url: '#',
    category: 'code',
    uploadedAt: '2026-08-03 10:15 PM',
    isFavorite: true,
    sharedChatIds: []
  },
  {
    id: 'file_003',
    ownerId: 'usr_me_101',
    name: 'liquid_hero_banner.png',
    size: 1887436,
    sizeFormatted: '1.8 MB',
    mimeType: 'image/png',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    category: 'image',
    uploadedAt: '2026-08-02 04:30 PM',
    isFavorite: false,
    sharedChatIds: ['chat_group_002']
  },
  {
    id: 'file_004',
    ownerId: 'usr_me_101',
    name: 'e2ee_protocol_audio_memo.mp3',
    size: 5242880,
    sizeFormatted: '5.0 MB',
    mimeType: 'audio/mp3',
    url: 'synth_voice_1',
    category: 'audio',
    uploadedAt: '2026-08-01 01:20 PM',
    isFavorite: false,
    sharedChatIds: ['chat_group_002']
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'xchord AI update',
    body: 'xchord AI by xchordlabs corp is ready to assist with your tasks & chat summaries.',
    timestamp: '10m ago',
    read: false,
    type: 'ai',
    linkChatId: 'chat_ai_001'
  },
  {
    id: 'notif_2',
    title: 'E2EE Group File Shared',
    body: 'Elena Rostova shared liquidchat_architecture_v2.pdf to Liquid Core Devs 🔒',
    timestamp: '30m ago',
    read: false,
    type: 'storage',
    linkChatId: 'chat_group_002'
  },
  {
    id: 'notif_3',
    title: 'Account Security Active',
    body: 'Your 12-word passkey was verified. E2EE active.',
    timestamp: '2h ago',
    read: true,
    type: 'security'
  }
];
