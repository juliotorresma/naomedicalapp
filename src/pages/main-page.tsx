import React, { useState, useRef, useEffect } from 'react';
 import { Select, Input, Button, Card, Space, Typography } from 'antd';
 import { AudioOutlined, PhoneOutlined, StopOutlined } from '@ant-design/icons';
 import axios from 'axios';

 const { Option } = Select;
 const { TextArea } = Input;
 const { Title } = Typography;

 interface TranslationAppState {
   fromLanguage: string;
   toLanguage: string;
   inputText: string;
   translatedText: string;
   isPlaybackEnabled: boolean;
   isRecording: boolean;
   translatedAudioUrl: string;
 }

 const TranslationApp: React.FC = () => {
   const [state, setState] = useState<TranslationAppState>({
     fromLanguage: 'es',
     toLanguage: 'en',
     inputText: '',
     translatedText: 'Texto traducido aparecerá aqui ....',
     isPlaybackEnabled: false,
     isRecording: false,
     translatedAudioUrl: '',
   });

   const recognitionRef = useRef<any>(null);
   const translatedAudioRef = useRef<HTMLAudioElement>(null);

   useEffect(() => {
     if ('webkitSpeechRecognition' in window) {
       recognitionRef.current = new (window as any).webkitSpeechRecognition();
       recognitionRef.current.continuous = true;
       recognitionRef.current.interimResults = true;

       recognitionRef.current.onresult = (event: any) => {
         let interimTranscript = '';
         let finalTranscript = '';
         for (let i = event.resultIndex; i < event.results.length; ++i) {
           if (event.results[i].isFinal) {
             finalTranscript += event.results[i][0].transcript;
           } else {
             interimTranscript += event.results[i][0].transcript;
           }
         }
         setState((prevState) => {
           const updatedInputText = interimTranscript || finalTranscript || prevState.inputText;
           // If we only want to translate on explicit stop, remove this call
           // if (finalTranscript && prevState.isRecording) {
           //   handleFinalizeRecording(finalTranscript, state.toLanguage);
           // }
           return {
             ...prevState,
             inputText: updatedInputText,
           };
         });
       };

       recognitionRef.current.onerror = (event: any) => {
         console.error('Speech recognition error:', event.error);
         setState(prevState => ({ ...prevState, isRecording: false }));
       };

       recognitionRef.current.onend = () => {
         setState(prevState => ({ ...prevState, isRecording: false }));
         // Translation might have been triggered in onresult
       };
     } else {
       console.warn('Speech recognition is not supported in this browser.');
     }

     return () => {
       if (recognitionRef.current) {
         recognitionRef.current.stop();
       }
     };
   }, [state.toLanguage]);

   const handleLanguageChange = (language: string, type: 'from' | 'to') => {
     setState(prevState => ({
       ...prevState,
       ...(type === 'from' ? { fromLanguage: language } : { toLanguage: language }),
       translatedAudioUrl: '', // Clear previous audio when language changes
     }));
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     setState(prevState => ({
       ...prevState,
       inputText: e.target.value,
       // Clear previous audio only if you want to clear it on input change
       // translatedAudioUrl: '',
     }));
   };

   const handleTranslate = () => {
     handleFinalizeRecording(state.inputText, state.toLanguage);
   };

   const handleSpeakOriginal = () => {
     if (state.inputText) {
       generateSpeech(state.inputText, state.fromLanguage);
     }
   };

   const handleEnablePlayback = () => {
     setState(prevState => ({ ...prevState, isPlaybackEnabled: !state.isPlaybackEnabled }));
     console.log('Enable Playback:', !state.isPlaybackEnabled);
   };

   const startRecording = () => {
     if (recognitionRef.current && !state.isRecording) {
       recognitionRef.current.lang = state.fromLanguage;
       recognitionRef.current.start();
       setState(prevState => ({
         ...prevState,
         isRecording: true,
         translatedAudioUrl: '', // Clear previous audio
       }));
     }
   };

   const handleFinalizeRecording = async (text: string, targetLanguage: string) => {
    try {
      const response = await axios.post(
        'https://api-rest-705644627870.us-central1.run.app/translate',
        { text: text, targetLanguage: targetLanguage }
      );
      setState(prevState => ({ ...prevState, translatedText: response.data.translation }));
      generateSpeech(response.data.translation, targetLanguage);
    } catch (error: any) {
      console.error('Error during translation:', error.response ? error.response.data : error.message);
      setState(prevState => ({ ...prevState, translatedText: 'Error al traducir.' }));
    }
  };

   const stopRecording = () => {
    if (recognitionRef.current && state.isRecording) {
      recognitionRef.current.stop();
      setState(prevState => ({ ...prevState, isRecording: false }));
      if (state.inputText) {
        handleFinalizeRecording(state.inputText, state.toLanguage);
      }
    }
  };

   const generateSpeech = async (text: string, language: string) => {
     try {
       const response = await axios.post(
         'https://api-rest-705644627870.us-central1.run.app/text-to-speech',
         { text: text, voice: language === 'en' ? 'alloy' : 'nova' }, // Adjust voice based on language
         { responseType: 'blob' }
       );
       const url = URL.createObjectURL(response.data);
       setState(prevState => ({ ...prevState, translatedAudioUrl: url }));
     } catch (error: any) {
       console.error('Error generating speech:', error.response ? error.response.data : error.message);
       setState(prevState => ({ ...prevState, translatedAudioUrl: '' }));
     }
   };

   return (
     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
       <Card title={<Title level={3}>Translation App Nao Medical</Title>} style={{ width: 600 }}>
         <Space direction="vertical" size="middle" style={{ width: '100%' }}>
           <Space align="center">
             <span>Speak</span>
             <Select
               defaultValue={state.fromLanguage}
               style={{ width: 120 }}
               onChange={(value) => handleLanguageChange(value, 'from')}
             >
               <Option value="es">Spanish</Option>
               <Option value="en">English</Option>
             </Select>
             <span>Translate To</span>
             <Select
               defaultValue={state.toLanguage}
               style={{ width: 120 }}
               onChange={(value) => handleLanguageChange(value, 'to')}
             >
               <Option value="en">English</Option>
               <Option value="es">Spanish</Option>
             </Select>
           </Space>

           <TextArea
             placeholder="Enter text to translate"
             rows={4}
             value={state.inputText}
             onChange={handleInputChange}
           />

           <Button type="primary" onClick={handleTranslate}>
             Translate
           </Button>

           <Space>
             {state.isRecording ? (
               <Button icon={<StopOutlined />} onClick={stopRecording} type="dashed">
                 Stop Recording
               </Button>
             ) : (
               <Button icon={<PhoneOutlined />} onClick={startRecording}>
                 Start Recording
               </Button>
             )}
             <Button icon={<AudioOutlined />} onClick={handleSpeakOriginal} disabled={state.isRecording || !state.inputText}>
               Speak Original
             </Button>
           </Space>

           <Button type={state.isPlaybackEnabled ? 'primary' : 'default'} onClick={handleEnablePlayback}>
             {state.isPlaybackEnabled ? 'Disable Playback' : 'Enable Playback'}
           </Button>

           <TextArea
             rows={4}
             value={state.translatedText}
             readOnly
           />

           {state.translatedAudioUrl && (
             <audio controls src={state.translatedAudioUrl} ref={translatedAudioRef}>
               Your browser does not support the audio element.
             </audio>
           )}
         </Space>
       </Card>
     </div>
   );
 };

 export default TranslationApp;