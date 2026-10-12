# Garment asset contract

Place licensed GLB files here: aurelia.glb, celeste.glb, rosalie.glb.
Models must be dress-only, with named nodes Bodice, Skirt and supported separate component nodes:
- Aurelia: Sleeves, Train, Overskirt
- Celeste: Sleeves, Train
- Rosalie: Train, Overskirt

Each component node may contain multiple meshes. All child meshes must belong to the appropriate node. Model scale is normalized by camera framing. Include fabric UVs and approved textures in the GLB. Existing texture maps are preserved while colour/roughness are adjusted. Check colour fidelity after export.

No licensed models were supplied with this repository. Missing files or nodes are reported explicitly. Production approval requires reviewing each model against the physical construction and marking its template enabled in PostgreSQL. Do not use a generated or procedural placeholder as a production garment.
