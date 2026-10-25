/* ============================================================
   RoomEnvironment.js — Ambient Room Scene
   Desk, floor, walls, and atmospheric elements around the bomb
   ============================================================ */

import * as THREE from 'three';

export class RoomEnvironment {
  constructor() {
    this.group = new THREE.Group();

    this._buildDesk();
    this._buildFloor();
    this._buildBackWall();
    this._buildAmbientProps();
  }

  /* ----------------------------------------------------------
     DESK — Surface the bomb sits on
  ---------------------------------------------------------- */
  _buildDesk() {
    // Desk top surface
    const deskGeo = new THREE.BoxGeometry(6, 0.12, 4);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x2a1f14,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.5, 0);
    desk.receiveShadow = true;
    desk.castShadow = true;
    this.group.add(desk);

    // Desk edge trim
    const edgeGeo = new THREE.BoxGeometry(6.04, 0.04, 0.08);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1510,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true,
    });

    // Front edge
    const frontEdge = new THREE.Mesh(edgeGeo, edgeMat);
    frontEdge.position.set(0, 0.5, 2.04);
    this.group.add(frontEdge);

    // Side edges
    const sideEdgeGeo = new THREE.BoxGeometry(0.08, 0.04, 4.04);
    const leftEdge = new THREE.Mesh(sideEdgeGeo, edgeMat);
    leftEdge.position.set(-3.02, 0.5, 0);
    this.group.add(leftEdge);

    const rightEdge = new THREE.Mesh(sideEdgeGeo, edgeMat);
    rightEdge.position.set(3.02, 0.5, 0);
    this.group.add(rightEdge);

    // Desk legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1a1510,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });

    const legPositions = [
      [-2.8, 0.25, -1.8],
      [2.8, 0.25, -1.8],
      [-2.8, 0.25, 1.8],
      [2.8, 0.25, 1.8],
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.group.add(leg);
    });
  }

  /* ----------------------------------------------------------
     FLOOR — Ground plane
  ---------------------------------------------------------- */
  _buildFloor() {
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f1a,
      roughness: 0.95,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  /* ----------------------------------------------------------
     BACK WALL — Subtle background
  ---------------------------------------------------------- */
  _buildBackWall() {
    const wallGeo = new THREE.PlaneGeometry(30, 15);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      roughness: 0.95,
      metalness: 0.0,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 7.5, -8);
    wall.receiveShadow = true;
    this.group.add(wall);
  }

  /* ----------------------------------------------------------
     AMBIENT PROPS — Small atmospheric details
  ---------------------------------------------------------- */
  _buildAmbientProps() {

    // Small tool/prop on desk — wrench-like shape
    const toolGeo = new THREE.BoxGeometry(0.4, 0.02, 0.08);
    const toolMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a7a,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true,
    });
    const tool = new THREE.Mesh(toolGeo, toolMat);
    tool.position.set(-2.2, 0.57, 1.2);
    tool.rotation.y = 0.3;
    tool.castShadow = true;
    this.group.add(tool);

    // Pencil
    const pencilGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6);
    const pencilMat = new THREE.MeshStandardMaterial({
      color: 0xf5c842,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    });
    const pencil = new THREE.Mesh(pencilGeo, pencilMat);
    pencil.position.set(2.0, 0.57, 0.8);
    pencil.rotation.z = Math.PI / 2;
    pencil.rotation.y = 0.5;
    pencil.castShadow = true;
    this.group.add(pencil);
  }

  /**
   * Get the Three.js group containing the entire room
   */
  getObject() {
    return this.group;
  }
}
