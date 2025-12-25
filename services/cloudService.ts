
import { ImageFile } from '../types';

// Type definitions for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// User needs to provide these in settings or env
const getGoogleConfig = () => ({
    apiKey: localStorage.getItem('lex_google_api_key') || process.env.GOOGLE_API_KEY || '',
    clientId: localStorage.getItem('lex_google_client_id') || process.env.GOOGLE_CLIENT_ID || '',
    appId: localStorage.getItem('lex_google_app_id') || process.env.GOOGLE_APP_ID || '',
});

let tokenClient: any;
let accessToken: string | null = null;
let pickerInited = false;
let gisInited = false;

export const cloudService = {
  
  initialize: async () => {
      const { apiKey, clientId } = getGoogleConfig();
      if (!apiKey || !clientId) throw new Error("Google API Key and Client ID required in Settings");

      return new Promise<void>((resolve, reject) => {
          const loadGapi = () => {
              window.gapi.load('client:picker', async () => {
                  await window.gapi.client.init({ apiKey: apiKey, discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"] });
                  pickerInited = true;
                  checkInit();
              });
          };

          const loadGis = () => {
              tokenClient = window.google.accounts.oauth2.initTokenClient({
                  client_id: clientId,
                  scope: 'https://www.googleapis.com/auth/drive.readonly',
                  callback: (response: any) => {
                      if (response.error !== undefined) {
                          reject(response);
                      }
                      accessToken = response.access_token;
                  },
              });
              gisInited = true;
              checkInit();
          };

          const checkInit = () => {
              if (pickerInited && gisInited) resolve();
          };

          if (!window.gapi) {
             // Script likely not loaded yet or blocked
             setTimeout(() => { if(window.gapi) loadGapi(); else reject("Google Scripts not loaded"); }, 1000);
          } else {
             loadGapi();
          }
          
          if (window.google) loadGis();
      });
  },

  pickFromGoogleDrive: async (): Promise<ImageFile[]> => {
    try {
        await cloudService.initialize();
    } catch (e) {
        console.error(e);
        throw new Error("Не удалось инициализировать Google Drive. Проверьте настройки API.");
    }

    return new Promise((resolve, reject) => {
      
      const createPicker = () => {
          if (!accessToken) return;
          const { appId } = getGoogleConfig();
          
          const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
          view.setMimeTypes("image/png,image/jpeg,image/jpg,application/pdf");

          const picker = new window.google.picker.PickerBuilder()
              .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
              .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
              .setAppId(appId)
              .setOAuthToken(accessToken)
              .addView(view)
              .addView(new window.google.picker.DocsUploadView())
              .setCallback(async (data: any) => {
                  if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                      const docs = data[window.google.picker.Response.DOCUMENTS];
                      const files: ImageFile[] = [];
                      
                      for (const doc of docs) {
                          const fileId = doc[window.google.picker.Document.ID];
                          try {
                              const fileData = await downloadFile(fileId, doc[window.google.picker.Document.MIME_TYPE]);
                              if (fileData) files.push(fileData);
                          } catch (e) {
                              console.error("Download failed", e);
                          }
                      }
                      resolve(files);
                  } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
                      resolve([]);
                  }
              })
              .build();
          picker.setVisible(true);
      };

      // Request token if needed
      if (accessToken === null) {
          tokenClient.callback = (resp: any) => {
              if (resp.error !== undefined) {
                  reject(resp);
                  return;
              }
              accessToken = resp.access_token;
              createPicker();
          };
          tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
          createPicker();
      }
    });
  },

  pickFromDropbox: async (): Promise<ImageFile[]> => {
    // Mock for now, as Dropbox requires a specific Drop-in script setup similar to Google
    return new Promise((resolve) => {
        setTimeout(() => {
             resolve([{
                id: `dropbox-${Date.now()}`,
                previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
                base64: 'placeholder_base64', 
                mimeType: 'image/jpeg'
              }]);
        }, 1500);
    });
  }
};

async function downloadFile(fileId: string, mimeType: string): Promise<ImageFile | null> {
    return window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    }).then((res: any) => {
        // Convert binary string to base64
        const binary = res.body;
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        
        // Manual Base64 conversion
        let binaryString = '';
        for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(binaryString);

        return {
            id: fileId,
            previewUrl: `data:${mimeType};base64,${base64}`,
            base64: base64,
            mimeType: mimeType
        };
    });
}
