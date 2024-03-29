'use client'
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvaseMouseMove, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";
import { useMutation, useRedo, useStorage, useUndo } from "../../liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import LeftSidebar from "@/components/LeftSidebar";
import { handleImageUpload } from "@/lib/shapes";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const shapeRef = useRef<fabric.Object | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawing = useRef(false);
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: '',
    value: '',
    icon: '',
  });

  const undo = useUndo();
  const redo = useRedo();

  const canvasObjects = useStorage((root) => root.canvasObjects);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get('canvasObjects');

    canvasObjects.set(objectId, shapeData);
  }, [])

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get('canvasObjects');

    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries() as any) {
      canvasObjects.delete(key);

    };

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get('canvasObjects');

    canvasObjects.delete(objectId);
  }, []);
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case 'reset':
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement)
        break;

      case 'delete': {
        handleDelete(fabricRef.current as any, deleteShapeFromStorage)
      }
        break;
      default:
        break;

      case 'image': {
        imageInputRef.current?.click();
        isDrawing.current = false;

        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }

        break;
      }
    }

    selectedShapeRef.current = elem?.value as string;
  }

  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef });

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
      })
    });

    canvas.on("mouse:up", (options) => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef,
      })
    });

    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
      })
    });
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      })
    });

    window.addEventListener("resize", () => {
      handleResize({ fabricRef })
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage
      })
    })

    return () => {
      canvas.dispose();
    }
  }, []);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef
    })
  }, [canvasObjects])
  return (
    <main className="h-screen overflow-hidden">
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e) => {
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef,
            shapeRef,
            syncShapeInStorage
          })
        }}
      />
      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)} />
        <Live canvasRef={canvasRef} />
        <RightSideBar />


      </section>
    </main>
  );
}