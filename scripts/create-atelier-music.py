from pathlib import Path
import numpy as np,wave
rate=22050;duration=48;out=np.zeros(rate*duration,dtype=np.float64)
def note(midi,start,length,level):
 f=440*2**((midi-69)/12);t=np.arange(int(length*rate))/rate
 tone=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*2*f*t)+.07*np.sin(2*np.pi*3*f*t)
 env=(1-np.exp(-t*15))*np.exp(-t/2.7)*np.minimum(1,(length-t)/.8)
 signal=tone*env*level
 for delay,gain in [(0,1),(.22,.16),(.47,.1),(.79,.06)]:
  a=int((start+delay)*rate);b=min(len(out),a+len(signal))
  if b>a:out[a:b]+=signal[:b-a]*gain
chords=[[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]]
for bar in range(8):
 chord=chords[bar%4]
 for k in range(8):note(chord[[0,2,3,4,1,2,3,4][k]],bar*6+k*.75,4,.055 if k==0 else .035)
 for midi in chord[2:]:note(midi+12,bar*6+1.5,4,.012)
fade=np.minimum(1,np.arange(len(out))/rate/1.5)*np.minimum(1,(len(out)-np.arange(len(out)))/rate/2)
out=np.clip(out*fade,-1,1);root=Path('public/audio');root.mkdir(exist_ok=True)
with wave.open(str(root/'atelier-soft-piano.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes((out*32767).astype('<i2').tobytes())
print('Original 48-second instrumental created.')
