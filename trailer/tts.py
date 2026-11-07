import sherpa_onnx, soundfile as sf, sys, json
D=sys.argv[1]; OUT=sys.argv[2]
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=D+"/model.int8.onnx",voices=D+"/voices.bin",tokens=D+"/tokens.txt",data_dir=D+"/espeak-ng-data"),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg); print("speakers",tts.num_speakers)
lines=json.load(open(sys.argv[3]))
info={}
for k,(sid,speed,text) in lines.items():
    a=tts.generate(text,sid=sid,speed=speed)
    sf.write(f"{OUT}/{k}.wav",a.samples,a.sample_rate); info[k]=round(len(a.samples)/a.sample_rate,2); print(k,info[k])
json.dump(info,open(OUT+"/durations.json","w"))
