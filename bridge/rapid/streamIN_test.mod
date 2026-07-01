MODULE streamIN_test
    !==========================================================================
    ! streamIN_test.mod — virtual-robot receiver for the digital-twin bridge.
    !
    ! TEST topology (option 1):
    !   [Python bridge]  = SERVER / controller  (stream_toolpath.py, listens)
    !   [RobotStudio VC] = virtual robot / CLIENT (this module, SocketConnect)
    !
    ! This robot dials the bridge, receives one move per line (15 comma-separated
    ! fields), parses it, and runs MoveL — so the RobotStudio arm mirrors what the
    ! bridge streams. Load into T_ROB1 on a Virtual Controller, set BRIDGE_IP /
    ! BRIDGE_PORT, set PP to main, and Play.
    !
    ! Wire line (newline-terminated):
    !   X,Y,Z, qx,qy,qz,qw, c1,c2,c3,c4, track, velocity, D01, D02
    !   - position mm, signed (+0000.00)
    !   - quaternion is xyzw on the wire; RAPID orient is wxyz -> reordered below
    !   - config sent 0,0,0,0 -> we run ConfL\Off
    !   - track/velocity unsigned; D01 = extruder on/off (logged here)
    !==========================================================================

    VAR socketdev sock;
    VAR string    sData;
    VAR num       vals{15};

    ! --- EDIT THESE for your setup ---------------------------------------------
    ! IP of the machine running stream_toolpath.py, as reachable from RobotStudio.
    ! Same PC -> 127.0.0.1 ; bridge on another box / host Mac -> that box's IP.
    CONST string BRIDGE_IP   := "127.0.0.1";
    CONST num    BRIDGE_PORT := 5656;

    PROC main()
        ! Poses arrive without confdata, so don't monitor configuration.
        ConfL \Off;
        ConfJ \Off;
        SingArea \Wrist;

        SocketCreate sock;
        SocketConnect sock, BRIDGE_IP, BRIDGE_PORT;
        TPErase;
        TPWrite "Connected to bridge " + BRIDGE_IP + ":" + NumToStr(BRIDGE_PORT, 0);

        WHILE TRUE DO
            SocketReceive sock \Str:=sData;
            IF StrLen(sData) > 0 THEN
                IF ParseLine(sData) THEN
                    DoMove;
                ENDIF
            ENDIF
        ENDWHILE

    ERROR
        IF ERRNO = ERR_SOCK_CLOSED THEN
            TPWrite "Bridge closed the connection.";
            SocketClose sock;
            STOP;
        ELSE
            ! e.g. unreachable target — skip this move, keep streaming.
            TPWrite "Move error " + NumToStr(ERRNO, 0) + " — skipped";
            TRYNEXT;
        ENDIF
    ENDPROC

    !--- Execute one parsed move ----------------------------------------------
    PROC DoMove()
        VAR robtarget p;
        VAR speeddata v;
        p := [[vals{1}, vals{2}, vals{3}],
              NormQuat(vals{7}, vals{4}, vals{5}, vals{6}),   ! wxyz <- xyzw
              [0, 0, 0, 0],
              [9E9, 9E9, 9E9, 9E9, 9E9, 9E9]];                ! no external axis
        v := [vals{13}, 500, 5000, 1000];                     ! v_tcp = velocity
        TPWrite "MoveL X" + NumToStr(vals{1},1) + " Y" + NumToStr(vals{2},1)
                + " Z" + NumToStr(vals{3},1) + "  D01=" + NumToStr(vals{14},0);
        MoveL p, v, z5, tool0;
    ENDPROC

    !--- Normalize a quaternion (wire is only 2 decimals, so re-normalize) ------
    FUNC orient NormQuat(num w, num x, num y, num z)
        VAR num m;
        m := Sqrt(w*w + x*x + y*y + z*z);
        IF m = 0 m := 1;
        RETURN [w/m, x/m, y/m, z/m];
    ENDFUNC

    !--- Split the 15-field CSV line into vals{1..15} ---------------------------
    FUNC bool ParseLine(string s)
        VAR num start := 1;
        VAR num comma;
        VAR string tok;
        FOR i FROM 1 TO 15 DO
            IF i < 15 THEN
                comma := StrFind(s, start, ",");
                tok := StrPart(s, start, comma - start);
                start := comma + 1;
            ELSE
                tok := StrPart(s, start, StrLen(s) - start + 1);
            ENDIF
            tok := CleanNum(tok);
            IF NOT StrToVal(tok, vals{i}) RETURN FALSE;
        ENDFOR
        RETURN TRUE;
    ERROR
        RETURN FALSE;
    ENDFUNC

    !--- Keep only numeric chars (strips the trailing newline / stray spaces) ---
    FUNC string CleanNum(string s)
        VAR string out := "";
        FOR i FROM 1 TO StrLen(s) DO
            IF StrMemb(s, i, "0123456789.+-Ee") out := out + StrPart(s, i, 1);
        ENDFOR
        RETURN out;
    ENDFUNC

ENDMODULE
