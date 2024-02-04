'use client'
import { useCallback, useEffect, useState } from "react";
import { useMyPresence, useOthers } from "../../liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";

const Live = () => {

    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });
    const [reaction, setReaction] = useState<Reaction[]>([]);

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if (cursor === null || cursorState.mode === CursorMode.ReactionSelector) {
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({ cursor: { x, y } })

        }
    }, []);

    const handlePointerLeave = useCallback((event: React.PointerEvent) => {

        setCursorState({
            mode: CursorMode.Hidden,
        });

        updateMyPresence({
            cursor: null,
            message: null
        });
    }, []);

    const handlePointerUp = useCallback((event: React.PointerEvent) => {

        setCursorState((state: CursorState) =>
            (cursorState.mode === CursorMode.Reaction) ? { ...state, isPressed: true } : state
        );
    }, [cursorState.mode, setCursorState])

    const handlePointerDown = useCallback((event: React.PointerEvent) => {

        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({
            cursor: { x, y }
        });

        setCursorState((state: CursorState) =>
            (cursorState.mode === CursorMode.Reaction) ? { ...state, isPressed: true } : state)
    }, [cursorState.mode, setCursorState]);

    useEffect(() => {
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key === '/') {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ''
                })
            } else if (event.key === 'Escape') {
                updateMyPresence({
                    message: null
                });

                setCursorState({
                    mode: CursorMode.Hidden
                });
            } else if (event.key === 'e') {
                setCursorState({
                    mode: CursorMode.ReactionSelector
                })
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === '/') {
                event.preventDefault();

                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ''
                })
            }

        };

        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('keydown', onKeyDown);
        }
    }, [updateMyPresence])

    const setReactions = useCallback((reaction: string) => {
        setCursorState({
            mode: CursorMode.Reaction,
            reaction,
            isPressed: false
        })
    }, [])
    return (
        <div
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            className="h-[100vh] text-center w-full flex justify-center items-center ">

            <h1 className="font-extralight text-white">Hello</h1>

            {reaction.map((r) => (
                <FlyingReaction 
                key={r.timestamp.toString()}
                x={r.point.x}
                y={r.point.y}
                timestamp={r.timestamp}
                value={r.value}
                />
            ))}
            {cursor && (
                <CursorChat
                    cursor={cursor}
                    cursorState={cursorState}
                    setCursorState={setCursorState}
                    updateMyPresence={updateMyPresence}
                />
            )}

            {cursorState.mode === CursorMode.ReactionSelector && (
                <ReactionSelector
                    setReaction={setReactions}
                />
            )}
            <LiveCursors others={others} />
        </div>
    )
}

export default Live